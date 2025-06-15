
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
    // Adiciona log de entrada
    let reqBody;
    try {
      reqBody = await req.json();
      console.log('[resumo-ia] Entrada recebida:', JSON.stringify(reqBody));
    } catch (parseErr) {
      console.error('[resumo-ia] Erro ao parsear body:', parseErr);
      return new Response(JSON.stringify({ resumo: "Erro ao interpretar requisição." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400
      });
    }
    const { texto, origem } = reqBody;
    if (!texto || !origem) {
      console.error(`[resumo-ia] Parâmetro texto ou origem ausente. texto? ${!!texto} origem? ${!!origem}`);
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
      console.error("[resumo-ia] Erro ao chamar OpenAI:", err);
      throw new Error("Erro ao chamar OpenAI: " + err);
    }
    const data = await response.json();
    const resumo = data.choices?.[0]?.message?.content || "Não foi possível gerar resumo.";

    // Salvar no campo correto da tabela
    let col = "";
    if (origem === "gpt4") col = "resumo_gpt";
    else if (origem === "claude") col = "resumo_claude";
    else if (origem === "gemini") col = "resumo_gemini";
    try {
      if (col) {
        // Busca os registros mais recentes com esse texto e atualiza o campo de resumo respectivo
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase
          .from("avaliacoes")
          .update({ [col]: resumo })
          .ilike("comentario", `%${texto.slice(0, 42)}%`);
        if (error) {
          console.error(`[resumo-ia] Erro ao salvar resumo na coluna ${col}:`, error);
        }
      }
    } catch (e) {
      console.error('[resumo-ia] Erro no bloco de salvar resumo no banco:', e);
    }

    // Log final de saída do resumo
    console.log("[resumo-ia] Resumo gerado para origem", origem, ":", resumo);

    return new Response(JSON.stringify({ resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('[resumo-ia] ERRO GERAL', e);
    return new Response(JSON.stringify({ resumo: "Erro ao gerar resumo. Tente novamente mais tarde." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
