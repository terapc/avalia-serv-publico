import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRequestKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (ip) return ip;
  const ua = req.headers.get("user-agent") || "none";
  const hash = crypto.subtle ? crypto.subtle.digest("SHA-1", new TextEncoder().encode(ua)) : null;
  if (hash) {
    return hash.then((arrBuf) =>
      Array.from(new Uint8Array(arrBuf)).map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  }
  return ua;
}

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const { avaliacoes } = payload as any;
  if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) return false;
  for (const av of avaliacoes) {
    const keys = Object.keys(av);
    const allow = ['id_avaliacao', 'nota_atendimento', 'nota_espera', 'nota_limpeza', 'nota_respeito', 'comentario', 'data_envio'];
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

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
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

  let key = await getRequestKey(req);
  if (key instanceof Promise) key = await key;
  const now = Date.now();
  const entry = rateLimitCache.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (entry.count >= RATE_LIMIT) {
    console.log(`[rate-limit] analyze-gemini: Limite excedido para chave ${key} (${entry.count}/${RATE_LIMIT})`);
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
    const prompt = `Você é um analista de dados especializado em saúde pública e usabilidade de serviços. Sua função é analisar as médias e padrões de avaliações feitas por cidadãos em um serviço de saúde municipal.

Com base nas informações:
- Notas de 1 a 5 para atendimento, espera, limpeza e respeito
- Comentários escritos dos usuários (se houver)
- Total de registros disponíveis
- Nenhuma informação pessoal do usuário

Forneça uma análise estatística e qualitativa com foco em:
1. Tendências gerais por categoria (pontos fortes e fracos)
2. Padrões recorrentes entre as notas (ex: correlação entre espera e satisfação)
3. Recomendações baseadas em evidências para otimizar o serviço
4. Considerações sobre necessidade de mais dados qualitativos (ex: comentários, datas)

Sua linguagem deve ser técnica, objetiva e estruturada.

Dados:
${JSON.stringify(avaliacoes)}`;

    const requestGemini = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 700
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestGemini)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Erro ao chamar Gemini: " + err);
    }
    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nenhum resultado gerado.";

    // Novo: gerar resumo chamando edge function resumo-ia e salvar no banco
    let resumo = "";
    try {
      const resumoResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/resumo-ia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ texto: analysis, origem: "gemini" })
      });
      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        resumo = resumoData.resumo;
      } else {
        const errText = await resumoResponse.text();
        resumo = "Não foi possível gerar resumo.";
        console.error("[analyze-gemini] erro na chamada da função resumo-ia:", errText);
      }
    } catch (e) {
      console.error('[analyze-gemini] exceção ao chamar resumo-ia:', e);
      resumo = "Não foi possível gerar resumo.";
    }

    return new Response(JSON.stringify({ analysis, resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-gemini]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
