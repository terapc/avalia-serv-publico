
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRequestKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (ip) return ip;
  const ua = req.headers.get("user-agent") || "none";
  return ua;
}

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const { avaliacoes } = payload as any;
  if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) return false;
  for (const av of avaliacoes) {
    const keys = Object.keys(av);
    const allow = ['id', 'nota_atendimento', 'nota_espera', 'nota_limpeza', 'nota_respeito', 'comentario', 'data_envio'];
    for (const k of keys) {
      if (!allow.includes(k)) return false;
    }
    for (const prop of ['nota_atendimento', 'nota_espera', 'nota_limpeza', 'nota_respeito']) {
      if (
        typeof av[prop] !== 'number' ||
        av[prop] < 1 ||
        av[prop] > 5
      ) return false;
    }
    if ('comentario' in av) {
      if (typeof av.comentario !== 'string' || av.comentario.length > 350) return false;
    }
  }
  return true;
}

const MAX_SIZE = 1024 * 1024;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_SIZE) {
    return new Response(JSON.stringify({ analysis: "Erro ao processar os dados." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 413,
    });
  }

  let key = getRequestKey(req);
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
    const bodyRaw = await req.text();
    if (bodyRaw.length > MAX_SIZE) {
      return new Response(JSON.stringify({ analysis: "Erro ao processar os dados." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 413
      });
    }
    let body;
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      return new Response(JSON.stringify({ analysis: "Erro ao processar os dados." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    if (!validatePayload(body)) {
      return new Response(JSON.stringify({ analysis: "Erro ao processar os dados." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    const { avaliacoes } = body;
    
    console.log(`[analyze-gpt4] Iniciando análise de ${avaliacoes.length} avaliações`);
    
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
        model: "gpt-4o-mini",
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
      console.error("[analyze-gpt4] Erro ao chamar OpenAI:", response.status, err);
      return new Response(JSON.stringify({ analysis: `Erro ao chamar OpenAI: ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Nenhum resultado gerado.";

    console.log(`[analyze-gpt4] Análise gerada com sucesso. Iniciando geração de resumo...`);

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
        console.log(`[analyze-gpt4] Resumo gerado com sucesso`);
      } else {
        const errText = await resumoResponse.text();
        resumo = "Não foi possível gerar resumo.";
        console.error("[analyze-gpt4] erro na chamada da função resumo-ia:", resumoResponse.status, errText);
      }
    } catch (e) {
      console.error('[analyze-gpt4] exceção ao chamar resumo-ia:', e);
      resumo = "Não foi possível gerar resumo.";
    }

    console.log(`[analyze-gpt4] Processamento completo`);

    return new Response(JSON.stringify({ analysis, resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-gpt4] Erro geral:', e);
    return new Response(JSON.stringify({ analysis: "Erro ao processar os dados." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
