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
    const { avaliacoes } = await req.json();
    const prompt = `Você é um especialista em políticas públicas e administração pública municipal. Com base nas seguintes avaliações da população sobre uma unidade de saúde — incluindo notas de 1 a 5 sobre atendimento, tempo de espera, limpeza e satisfação geral, além de comentários textuais — identifique:

1. Pontos positivos observados.
2. Pontos negativos e desafios enfrentados.
3. Recomendações objetivas e práticas para a gestão pública.
4. Estratégias possíveis para aumentar a satisfação do cidadão.

Seja claro, direto e use linguagem acessível a gestores públicos.

Avaliações recebidas:
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
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-gpt4]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
