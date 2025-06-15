
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
    const { texto, origem } = await req.json();
    if (!texto || !origem) {
      throw new Error("Parâmetro texto ou origem ausente.");
    }
    const prompt = `Resuma o seguinte texto de forma clara, objetiva e profissional, com no máximo 3 frases. O objetivo é destacar os pontos principais da análise, mantendo a linguagem formal e acessível. Não use títulos ou enumerações. Evite termos genéricos como "conforme os dados" e vá direto ao ponto. Este resumo será exibido ao público antes do texto completo.

Texto a ser resumido:
${texto}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {role: "system", content: "Você é um redator profissional de resumos para gestores públicos."},
          {role: "user", content: prompt}
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error("Erro ao chamar OpenAI: " + err);
    }
    const data = await response.json();
    const resumo = data.choices?.[0]?.message?.content || "Não foi possível gerar resumo.";

    // Salvar no campo correto da tabela
    let col = "";
    if (origem === "gpt4") col = "resumo_gpt";
    else if (origem === "claude") col = "resumo_claude";
    else if (origem === "gemini") col = "resumo_gemini";
    // Opcional: Salva o resumo em todos os registros com texto igual (não sabemos o id)
    try {
      if (col) {
        // Busca os registros mais recentes com esse texto e atualiza o campo de resumo respectivo
        // Usa .ilike para encontrar ocorrências recentes do texto longo
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Atualiza registros com comentário/analise igual ao texto (multiplo, pode ser ajustado)
        await supabase
          .from("avaliacoes")
          .update({ [col]: resumo })
          .ilike("comentario", `%${texto.slice(0, 42)}%`); // Se quiser ajustar, pode mudar para outro critério
      }
    } catch (e) {
      console.error('[resumo-ia] erro ao salvar resumo no banco:', e);
    }

    return new Response(JSON.stringify({ resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[resumo-ia]', e);
    return new Response(JSON.stringify({ resumo: "Erro ao gerar resumo. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
