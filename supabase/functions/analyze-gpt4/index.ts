
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    console.log('[analyze-gpt4] Iniciando análise...');
    
    const { avaliacoes } = await req.json();
    
    if (!avaliacoes || !Array.isArray(avaliacoes)) {
      throw new Error('Avaliações inválidas');
    }

    console.log(`[analyze-gpt4] Analisando ${avaliacoes.length} avaliações`);

    const prompt = `Você é um especialista em políticas públicas e análise de qualidade de serviços governamentais. Analise os dados de satisfação dos usuários em um serviço de saúde pública e apresente recomendações baseadas em boas práticas administrativas.

Baseie-se nas seguintes informações:
- Quatro indicadores numéricos de 1 a 5: atendimento, espera, limpeza e respeito
- Comentário livre dos cidadãos
- Total de avaliações e médias por categoria

Sua análise deve conter:
1. Identificação dos pontos positivos e negativos nas experiências dos usuários.
2. Recomendações práticas e objetivas para melhoria dos serviços.
3. Sugestões administrativas baseadas em boas práticas de gestão pública.
4. Tom analítico, profissional e voltado à tomada de decisão.

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
          { role: "system", content: "Especialista em políticas públicas focado em análise de dados e recomendações práticas." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      throw new Error(`Erro OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Nenhum resultado gerado.";

    console.log('[analyze-gpt4] Análise gerada. Gerando resumo...');

    // Gerar resumo
    let resumo = "Resumo não disponível.";
    try {
      const resumoResponse = await fetch(`${supabaseUrl}/functions/v1/resumo-ia`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ texto: analysis, origem: "gpt4" })
      });

      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        resumo = resumoData.resumo || "Resumo não disponível.";
        console.log('[analyze-gpt4] Resumo gerado com sucesso');
      } else {
        console.error('[analyze-gpt4] Erro ao gerar resumo:', resumoResponse.status);
      }
    } catch (e) {
      console.error('[analyze-gpt4] Exceção ao gerar resumo:', e);
    }

    return new Response(JSON.stringify({ analysis, resumo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[analyze-gpt4] Erro:', error);
    return new Response(JSON.stringify({ 
      analysis: "Erro ao gerar análise. Tente novamente.", 
      resumo: "Erro ao gerar resumo." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
