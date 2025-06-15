import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

const QUESTIONS = [
  { id: "q1", label: "Atendimento" },
  { id: "q2", label: "Tempo de espera" },
  { id: "q3", label: "Estrutura" },
  { id: "q4", label: "Satisfação geral" }
];

type Answered = {
  id: string;
  nota_atendimento: number | null;
  nota_espera: number | null;
  nota_limpeza: number | null;
  nota_respeito: number | null;
  comentario?: string;
  data_envio?: string;
};

type AnalysisSource = "gpt4" | "claude" | "gemini";
const ANALYSIS_LABELS = {
  gpt4: "GPT-4",
  claude: "Claude",
  gemini: "Gemini"
};

async function fetchAvaliacoes() {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id,nota_atendimento,nota_espera,nota_limpeza,nota_respeito,comentario,data_envio")
    .order("data_envio", { ascending: false });
  if (error) throw error;
  return data as Answered[];
}

async function callAnalysis(source: AnalysisSource, data: Answered[]) {
  // Chama a edge function correspondente
  const { data: response, error } = await supabase.functions.invoke(`analyze-${source}`, {
    body: { avaliacoes: data },
  });
  if (error) throw error;
  return response?.analysis || "Nenhum resultado gerado.";
}

// Novo: hook utilitário para painel expand/collapse por IA
function useCollapsibleStates(sources: string[]) {
  const [state, setState] = useState<{[k: string]: boolean}>({});
  const toggle = (k: string) => setState(s => ({...s, [k]: !s[k]}));
  return { open: state, toggle };
}

// Novo: Função que salva resumo+análise na tabela avaliacoes
async function saveAnalysisSummaryToDB(source: AnalysisSource, analysis: string, resumo: string) {
  const keyAnalysis = {
    gpt4: { analysis: "resumo_gpt", field: "resumo_gpt" },
    claude: { analysis: "resumo_claude", field: "resumo_claude" },
    gemini: { analysis: "resumo_gemini", field: "resumo_gemini" }
  };
  // Salvar apenas no primeiro registro para simplificação (ou adaptar para lógica real)
  await supabase
    .from("avaliacoes")
    .update({ [keyAnalysis[source].field]: resumo })
    .neq("id", "null"); // <= Placeholder. Ajuste conforme a regra de save.
}

const ResultsDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<{[k in AnalysisSource]?: string}>({});
  const [resumos, setResumos] = useState<{[k in AnalysisSource]?: string}>({});
  const [loading, setLoading] = useState<{[k in AnalysisSource]?: boolean}>({});
  const { open, toggle } = useCollapsibleStates(["gpt4", "claude", "gemini"]);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: fetchAvaliacoes,
  });

  const totals = QUESTIONS.map(q => {
    if (!data) return "--";
    let scores: number[] = [];
    if (q.id === "q1") scores = data.map(a => a.nota_atendimento ?? 0).filter(Boolean);
    if (q.id === "q2") scores = data.map(a => a.nota_espera ?? 0).filter(Boolean);
    if (q.id === "q3") scores = data.map(a => a.nota_limpeza ?? 0).filter(Boolean);
    if (q.id === "q4") scores = data.map(a => a.nota_respeito ?? 0).filter(Boolean);
    return scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2) : "--";
  });

  async function handleAnalysis(source: AnalysisSource) {
    setLoading(l => ({...l, [source]: true}));
    try {
      // Chama a Edge Function e já recebe resumo + análise
      const { data: response, error } = await supabase.functions.invoke(`analyze-${source}`, {
        body: { avaliacoes: data || [] },
      });
      if (error) throw error;
      setAnalyses(a => ({...a, [source]: response?.analysis || ""}));
      setResumos(r => ({...r, [source]: response?.resumo || ""}));
      // Opcional: Salva no banco de dados
      // await saveAnalysisSummaryToDB(source, response?.analysis, response?.resumo);
    } catch (err) {
      setAnalyses(a => ({...a, [source]: "Erro ao gerar análise. Tente novamente mais tarde."}));
      setResumos(r => ({...r, [source]: "Erro ao gerar resumo."}));
    }
    setLoading(l => ({...l, [source]: false}));
  }

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Médias/Notas */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[320px]">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Média das avaliações</h3>
        {isLoading ? (
          <div className="text-center py-8">Carregando avaliações…</div>
        ) : error ? (
          <div className="text-red-600">Erro ao buscar dados.</div>
        ) : (
          <>
            <table className="w-full mb-4">
              <tbody>
                {QUESTIONS.map((q,i) => (
                  <tr key={q.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{q.label}</td>
                    <td className="py-2 text-center">
                      <span className="inline-block rounded-full bg-blue-100 text-blue-600 w-12 font-mono font-bold text-lg">{totals[i]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm text-muted-foreground">
              Total de avaliações:{" "}
              <span className="font-bold">{data?.length || 0}</span>
            </div>
          </>
        )}
      </div>

      {/* Coluna 2: Análises IA */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-green-900">Análise Inteligente</h3>
        <div className="flex gap-2 mb-4">
          {(["gpt4", "claude", "gemini"] as AnalysisSource[]).map(src => (
            <button
              key={src}
              disabled={loading[src] || isLoading}
              onClick={() => handleAnalysis(src)}
              className={`flex items-center gap-1 px-5 py-2 rounded-xl font-semibold border shadow border-green-200 bg-green-50 hover:bg-green-100 transition text-green-800 disabled:opacity-60`}
            >
              {analyses[src] ? <Check size={18} /> : null}
              Analisar via {ANALYSIS_LABELS[src]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {(["gpt4", "claude", "gemini"] as AnalysisSource[]).map(src => (
            <div key={src} className="bg-gray-50 rounded-lg px-4 py-3 border">
              <div className="text-xs font-bold text-green-800 mb-1">{ANALYSIS_LABELS[src]}</div>
              {loading[src] ? (
                <div className="text-gray-400">Analisando dados…</div>
              ) : resumos[src] ? (
                <div>
                  <div className="mb-2">{resumos[src]}</div>
                  <button
                    className="text-green-700 text-xs font-semibold underline hover-scale"
                    onClick={() => toggle(src)}
                  >
                    {open[src] ? "Ocultar análise completa" : "Ver análise completa"}
                  </button>
                  {open[src] &&
                    <div className="mt-2 text-gray-800 animate-fade-in" style={{whiteSpace: "pre-line"}}>{analyses[src]}</div>
                  }
                </div>
              ) : (
                <div className="text-gray-400">Clique no botão acima para gerar a análise.</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ResultsDashboard;
