import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avaliacoes } = await req.json();
    const prompt = `Você é um analista de dados especializado em tendências de comportamento em serviços públicos. Abaixo estão avaliações anônimas feitas por usuários de uma unidade de saúde municipal, com notas de 1 a 5 em diferentes critérios e, às vezes, comentários.

Sua tarefa é:
1. Detectar padrões nas respostas.
2. Identificar correlações entre critérios.
3. Indicar temas recorrentes e destacar potenciais áreas críticas.
4. Sugerir visualizações ou dados complementares que poderiam aprofundar a análise.

Seja técnico, claro e oriente decisões com base nos dados disponíveis.

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
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-gemini]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
