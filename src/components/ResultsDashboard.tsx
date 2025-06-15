
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowDown } from "lucide-react";

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
const ANALYSIS_COLORS = {
  gpt4: "from-blue-200 to-blue-100 border-blue-400",
  claude: "from-green-100 to-green-50 border-green-300",
  gemini: "from-cyan-100 to-blue-50 border-cyan-400"
};

async function fetchAvaliacoes() {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id,nota_atendimento,nota_espera,nota_limpeza,nota_respeito,comentario,data_envio")
    .order("data_envio", { ascending: false });
  if (error) throw error;
  return data as Answered[];
}

function useCollapsibleStates(sources: string[]) {
  const [state, setState] = useState<{[k: string]: boolean}>({});
  const toggle = (k: string) => setState(s => ({...s, [k]: !s[k]}));
  return { open: state, toggle };
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
      const { data: response, error } = await supabase.functions.invoke(`analyze-${source}`, {
        body: { avaliacoes: data || [] },
      });
      if (error) throw error;
      setAnalyses(a => ({...a, [source]: response?.analysis || ""}));
      setResumos(r => ({...r, [source]: response?.resumo || ""}));
    } catch (err) {
      setAnalyses(a => ({...a, [source]: "Erro ao gerar análise. Tente novamente mais tarde."}));
      setResumos(r => ({...r, [source]: "Erro ao gerar resumo."}));
    }
    setLoading(l => ({...l, [source]: false}));
  }

  // Simula download de PDF
  function handleDownloadPDF() {
    window.alert("Relatório em PDF será gerado em breve. (Funcionalidade simulada para apresentação)");
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
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              Total de avaliações: 
              <span className="font-bold">{data?.length || 0}</span>
              <button onClick={handleDownloadPDF}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-full font-semibold shadow hover:from-blue-500 hover:to-green-500 flex gap-2 items-center transition-colors text-sm"
                title="Baixar relatório em PDF"
              >
                <ArrowDown size={18} /> Baixar PDF do relatório
              </button>
            </div>
          </>
        )}
      </div>
      {/* Coluna 2: Análises IA, separando visualmente cada bloco */}
      <div className="flex flex-col gap-5">
        {(["gpt4","claude","gemini"] as AnalysisSource[]).map(src => (
          <div
            key={src}
            className={`bg-gradient-to-br ${ANALYSIS_COLORS[src]} rounded-xl shadow border px-5 py-5 flex flex-col`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-bold text-lg ${
                src==="gpt4"? "text-blue-800" : src==="claude"? "text-green-700" : "text-cyan-700"
              }`}>
                {ANALYSIS_LABELS[src]}
              </span>
              <button
                disabled={loading[src] || isLoading}
                onClick={() => handleAnalysis(src)}
                className={`ml-2 flex items-center gap-1 px-4 py-1.5 rounded font-semibold border border-opacity-40 bg-white/80 hover:bg-white transition text-sm ${
                  loading[src] ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {analyses[src] ? <Check size={18} /> : null}
                {loading[src] ? "Gerando análise..." : `Analisar via ${ANALYSIS_LABELS[src]}`}
              </button>
            </div>
            <div>
              {loading[src] ? (
                <div className="text-gray-600 italic py-2">Analisando dados…</div>
              ) : resumos[src] ? (
                <div>
                  <div className="mb-2 text-gray-800">{resumos[src]}</div>
                  <button
                    className="text-blue-700 text-xs font-semibold underline"
                    onClick={() => toggle(src)}
                  >
                    {open[src]
                      ? "Ocultar análise completa"
                      : "Ver análise completa"}
                  </button>
                  {open[src] &&
                    <div className="mt-2 text-gray-800 bg-white/70 rounded p-3 animate-fade-in whitespace-pre-line border text-sm">
                      {analyses[src]}
                    </div>
                  }
                </div>
              ) : (
                <div className="text-gray-500 text-sm py-2">Clique no botão acima para gerar a análise desta IA.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ResultsDashboard;
