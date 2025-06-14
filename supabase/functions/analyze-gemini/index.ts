
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
    const comentarios = avaliacoes.map((a,i) =>
      `Avaliação #${i+1}:\nAtendimento: ${a.nota_atendimento} | Espera: ${a.nota_espera} | Limpeza: ${a.nota_limpeza} | Satisfação: ${a.nota_respeito}\nComentário: ${a.comentario || "(sem comentário)"}\n`
    ).join('\n');
    const prompt = `Aja como um especialista em análise de dados sociais. Escreva uma visão geral das tendências observadas nas avaliações, identificando padrões, temas recorrentes e mudanças ao longo do tempo. (Evite sugestões ou julgamentos diretos) \n\n${comentarios}`;
    const requestGemini = {
      model: "gemini-1.5-flash",
      messages: [
        {role: "user", content: [{ type: "text", text: prompt }] }
      ],
      temperature: 0.4,
      max_tokens: 700
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
