
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[resumo-ia] Iniciando processamento...');
    
    const body = await req.json();
    console.log('[resumo-ia] Body recebido:', Object.keys(body));
    
    const { texto, origem } = body;
    
    if (!texto || typeof texto !== "string") {
      console.error('[resumo-ia] Texto inválido:', typeof texto);
      return new Response(JSON.stringify({ resumo: "Texto não encontrado para resumir." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!origem || !["gpt4", "claude", "gemini"].includes(origem)) {
      console.error('[resumo-ia] Origem inválida:', origem);
      return new Response(JSON.stringify({ resumo: "Origem inválida." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!openAIApiKey) {
      console.error('[resumo-ia] OpenAI API key não configurada');
      return new Response(JSON.stringify({ resumo: "API key não configurada." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }

    console.log(`[resumo-ia] Gerando resumo para origem: ${origem}, texto length: ${texto.length}`);

    const prompt = `Faça um resumo executivo em português do seguinte texto em no máximo 3 frases. Seja objetivo e destaque os pontos principais da análise.

Texto para resumir:
${texto}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em criar resumos executivos claros e objetivos." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[resumo-ia] Erro OpenAI:', response.status, errorText);
      throw new Error(`Erro OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const resumo = data.choices?.[0]?.message?.content || "Não foi possível gerar resumo.";

    console.log(`[resumo-ia] Resumo gerado com sucesso para ${origem}`);

    return new Response(JSON.stringify({ resumo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[resumo-ia] Erro geral:', error);
    return new Response(JSON.stringify({ resumo: "Erro interno. Tente novamente." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
