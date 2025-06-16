
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[analyze-claude] Iniciando análise...');
    
    const { avaliacoes } = await req.json();
    
    if (!avaliacoes || !Array.isArray(avaliacoes)) {
      throw new Error('Avaliações inválidas');
    }

    console.log(`[analyze-claude] Analisando ${avaliacoes.length} avaliações`);

    const prompt = `Você é um consultor especializado em gestão pública e atendimento ao cidadão. Analise as avaliações de usuários sobre serviços públicos de saúde e gere um parecer técnico com foco em empatia e melhoria contínua. Use uma linguagem profissional, acessível e motivadora.

Considere os seguintes dados:
- Quatro notas de 1 a 5: nota_atendimento, nota_espera, nota_limpeza, nota_respeito
- Comentário livre do cidadão (campo comentario)
- Total de avaliações realizadas
- Média geral de cada indicador

Sua resposta deve conter:
1. Identificação de pontos fortes e fracos nas avaliações.
2. Sugestões práticas para a equipe pública melhorar a experiência do cidadão.
3. Um parágrafo final motivacional voltado à equipe pública, incentivando a busca por excelência e acolhimento.

Dados recebidos:
${JSON.stringify(avaliacoes)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        system: "Consultor de experiência do cidadão, empático e focado em melhorias práticas.",
        max_tokens: 700,
        temperature: 0.4,
        messages: [
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text || "Nenhum resultado gerado.";

    console.log('[analyze-claude] Análise gerada. Gerando resumo...');

    // Gerar resumo
    let resumo = "Resumo não disponível.";
    try {
      const resumoResponse = await fetch(`${supabaseUrl}/functions/v1/resumo-ia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ texto: analysis, origem: "claude" })
      });

      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        resumo = resumoData.resumo || "Resumo não disponível.";
        console.log('[analyze-claude] Resumo gerado com sucesso');
      } else {
        console.error('[analyze-claude] Erro ao gerar resumo:', resumoResponse.status);
      }
    } catch (e) {
      console.error('[analyze-claude] Exceção ao gerar resumo:', e);
    }

    return new Response(JSON.stringify({ analysis, resumo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[analyze-claude] Erro:', error);
    return new Response(JSON.stringify({ 
      analysis: "Erro ao gerar análise. Tente novamente.", 
      resumo: "Erro ao gerar resumo." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
