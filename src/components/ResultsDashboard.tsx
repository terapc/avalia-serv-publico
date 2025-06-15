import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowDown, Trash2, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { generateFakeData } from "@/lib/testData";
import { toast } from "sonner";

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

async function fetchInteractions() {
  const { data, error } = await supabase.from("interacoes").select("tipo_interacao");
  if (error) {
    console.error("Error fetching interactions:", error);
    return [];
  }
  return data;
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
  const [simulationLoading, setSimulationLoading] = useState<"zerar" | "gerar" | null>(null);

  const { open, toggle } = useCollapsibleStates(["gpt4", "claude", "gemini"]);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: fetchAvaliacoes,
  });

  const { data: interactionsData } = useQuery({
    queryKey: ["interactions"],
    queryFn: fetchInteractions,
  });

  const interactionCounts = useMemo(() => {
    if (!interactionsData) return {};
    return interactionsData.reduce((acc, curr) => {
      acc[curr.tipo_interacao] = (acc[curr.tipo_interacao] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});
  }, [interactionsData]);

  const totals = QUESTIONS.map(q => {
    if (!data) return "--";
    let scores: number[] = [];
    if (q.id === "q1") scores = data.map(a => a.nota_atendimento ?? 0).filter(Boolean);
    if (q.id === "q2") scores = data.map(a => a.nota_espera ?? 0).filter(Boolean);
    if (q.id === "q3") scores = data.map(a => a.nota_limpeza ?? 0).filter(Boolean);
    if (q.id === "q4") scores = data.map(a => a.nota_respeito ?? 0).filter(Boolean);
    return scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2) : "--";
  });

  async function logInteraction(type: string) {
    await supabase.from("interacoes").insert({ tipo_interacao: type });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
  }

  async function handleAnalysis(source: AnalysisSource) {
    await logInteraction(`analisar_${source}`);
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
  
  async function handleZerarDados() {
    setSimulationLoading("zerar");
    await logInteraction("zerar_dados");
    const { error } = await supabase.from("avaliacoes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Erro ao apagar os dados.", { description: error.message });
    } else {
      toast.success("Todos os dados de avaliação foram apagados!");
    }
    await refetch();
    setSimulationLoading(null);
  }
  
  async function handleGerarDados() {
    setSimulationLoading("gerar");
    await logInteraction("gerar_dados");
    const fakeData = generateFakeData(50);
    const { error } = await supabase.from("avaliacoes").insert(fakeData);
     if (error) {
      toast.error("Erro ao gerar dados de teste.", { description: error.message });
    } else {
      toast.success("50 novos registros de teste foram criados!");
    }
    await refetch();
    setSimulationLoading(null);
  }

  function handleDownloadPDF() {
    window.alert("Relatório em PDF será gerado em breve. (Funcionalidade simulada para apresentação)");
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Médias/Notas e Controles de Simulação */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[320px]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-800">Média das avaliações</h3>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGerarDados} disabled={!!simulationLoading}>
                    {simulationLoading === 'gerar' ? <Loader2 className="animate-spin"/> : <FlaskConical size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gerar 50 registros de teste</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="icon" onClick={handleZerarDados} disabled={!!simulationLoading}>
                    {simulationLoading === 'zerar' ? <Loader2 className="animate-spin"/> : <Trash2 size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Apagar todos os dados</TooltipContent>
              </Tooltip>
            </div>
          </div>
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
      </div>
      {/* Coluna 2: Análises IA */}
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
              <Button
                disabled={loading[src] || isLoading}
                onClick={() => handleAnalysis(src as AnalysisSource)}
                variant="secondary"
                size="sm"
                className={`ml-2 flex items-center gap-2 px-4 py-1.5 rounded font-semibold border border-opacity-40 bg-white/80 hover:bg-white transition text-sm ${
                  loading[src] ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {analyses[src] ? <Check size={16} /> : null}
                {loading[src] ? "Gerando..." : `Analisar com ${ANALYSIS_LABELS[src]}`}
                <span className="text-xs opacity-80">({interactionCounts[`analisar_${src}`] || 0})</span>
              </Button>
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
