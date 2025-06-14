
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
    const comentarios = avaliacoes.map((a,i) =>
      `Avaliação #${i+1}:\nAtendimento: ${a.nota_atendimento} | Espera: ${a.nota_espera} | Limpeza: ${a.nota_limpeza} | Satisfação: ${a.nota_respeito}\nComentário: ${a.comentario || "(sem comentário)"}\n`
    ).join('\n');
    const prompt = `Como consultor de experiência do cidadão, faça um breve resumo apontando as principais oportunidades de melhoria em processos, estrutura ou atendimento público municipal com base nos relatos abaixo. Termine com uma mensagem de incentivo curta para a equipe.\n\n${comentarios}`;
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
