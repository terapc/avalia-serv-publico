import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
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
    const prompt = `Você é um consultor especializado em experiência do cidadão. Analise os dados coletados por uma pesquisa de satisfação feita com usuários de uma unidade de saúde pública. Com base nas notas (1 a 5) e comentários fornecidos, forneça:

1. Um diagnóstico geral da experiência do cidadão.
2. Oportunidades claras de melhoria nos serviços.
3. Sugestões de ações estratégicas voltadas para aumentar a confiança da população.
4. Uma mensagem motivacional e inspiradora para a equipe da unidade de saúde, valorizando seu papel e incentivando a excelência no serviço público.

Avaliações recebidas:
${JSON.stringify(avaliacoes)}`;

    const requestAnthropic = {
      model: "claude-3-haiku-20240307",
      system: "Consultor de experiência do cidadão, direto e objetivo, propondo melhorias a partir dos dados recebidos.",
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        {"role": "user", "content": prompt}
      ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestAnthropic)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Erro ao chamar Anthropic: " + err);
    }
    const data = await response.json();
    const analysis = data.content?.[0]?.text || "Nenhum resultado gerado.";
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-claude]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
