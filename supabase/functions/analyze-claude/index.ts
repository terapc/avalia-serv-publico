
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
    const prompt = `Você é um consultor especializado em gestão pública e atendimento ao cidadão. Seu papel é analisar avaliações de usuários sobre serviços públicos de saúde e gerar um parecer técnico com foco em empatia e melhoria contínua. Use uma linguagem profissional, acessível e motivadora.

Considere os seguintes dados:
- Quatro notas de 1 a 5: nota_atendimento, nota_espera, nota_limpeza, nota_respeito
- Comentário livre do cidadão (campo \`comentario\`)
- Total de avaliações realizadas
- Média geral de cada indicador

Sua resposta deve conter:
1. Identificação de pontos fortes e fracos nas avaliações.
2. Sugestões práticas para a equipe pública melhorar a experiência do cidadão.
3. Um parágrafo final motivacional voltado à equipe pública, incentivando a busca por excelência e acolhimento.

Evite repetir dados numéricos que já estão na tela. Foque na interpretação humana das avaliações.

Dados recebidos:
${JSON.stringify(avaliacoes)}`;

    const requestAnthropic = {
      model: "claude-3-haiku-20240307",
      system: "Consultor de experiência do cidadão, direto e objetivo, propondo melhorias a partir dos dados recebidos.",
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        { "role": "user", "content": prompt }
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

    // Novo: gerar resumo chamando edge function resumo-ia e salvar no banco
    let resumo = "";
    try {
      const resumoResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/resumo-ia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ texto: analysis, origem: "claude" })
      });
      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        resumo = resumoData.resumo;
      } else {
        const errText = await resumoResponse.text();
        resumo = "Não foi possível gerar resumo.";
        console.error("[analyze-claude] erro na chamada da função resumo-ia:", errText);
      }
    } catch (e) {
      console.error('[analyze-claude] exceção ao chamar resumo-ia:', e);
      resumo = "Não foi possível gerar resumo.";
    }
    return new Response(JSON.stringify({ analysis, resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[analyze-claude]', e);
    return new Response(JSON.stringify({ analysis: "Erro ao gerar análise. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
