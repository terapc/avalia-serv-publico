import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Rate limiting cache (em memória, reinicia a cada deploy de função)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

function getRequestKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (ip) return ip;
  // Fallback: gera hash SHA-1 do User-Agent, se User-Agent existir
  const ua = req.headers.get("user-agent") || "none";
  const hash = crypto.subtle ? crypto.subtle.digest("SHA-1", new TextEncoder().encode(ua)) : null;
  if (hash) {
    // converte buffer em hex
    return hash.then((arrBuf) =>
      Array.from(new Uint8Array(arrBuf)).map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  }
  return ua;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  let key = await getRequestKey(req);
  if (key instanceof Promise) key = await key;
  const now = Date.now();
  const entry = rateLimitCache.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (entry.count >= RATE_LIMIT) {
    console.log(`[rate-limit] analyze-gpt4: Limite excedido para chave ${key} (${entry.count}/${RATE_LIMIT})`);
    return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em 1 hora." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 429,
    });
  } else {
    rateLimitCache.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
  }

  try {
    const { avaliacoes } = await req.json();
    const prompt = `Você é um especialista em políticas públicas e análise de qualidade de serviços governamentais. Seu papel é interpretar os dados de satisfação dos usuários em um serviço de saúde pública e apresentar recomendações baseadas em boas práticas administrativas.

Baseie-se nas seguintes informações:
- Quatro indicadores numéricos de 1 a 5: atendimento, espera, limpeza e respeito
- Comentário livre dos cidadãos
- Total de avaliações e médias por categoria

Sua análise deve conter:
1. Identificação dos pontos positivos e negativos nas experiências dos usuários.
2. Recomendações práticas e objetivas para melhoria dos serviços.
3. Sugestões administrativas baseadas em boas práticas de gestão pública.
4. Tom analítico, profissional e voltado à tomada de decisão.

Evite repetir valores numéricos já exibidos na tela. O foco é em análise e melhoria.

Dados:
${JSON.stringify(avaliacoes)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {role: "system", content: "Especialista em políticas públicas. Sempre segue as orientações do usuário e os dados recebidos para avaliações."},
          {role: "user", content: prompt}
        ],
        temperature: 0.4,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Erro ao chamar OpenAI: " + err);
    }
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Nenhum resultado gerado.";

    // Novo: gerar resumo chamando edge function resumo-ia e salvar no banco
    let resumo = "";
    try {
      const resumoResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/resumo-ia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ texto: analysis, origem: "gpt4" })
      });
      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        resumo = resumoData.resumo;
      } else {
        const errText = await resumoResponse.text();
        resumo = "Não foi possível gerar resumo.";
        console.error("[analyze-gpt4] erro na chamada da função resumo-ia:", errText);
      }
    } catch (e) {
      console.error('[analyze-gpt4] exceção ao chamar resumo-ia:', e);
      resumo = "Não foi possível gerar resumo.";
    }

    return new Response(JSON.stringify({ analysis, resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-gpt4]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
