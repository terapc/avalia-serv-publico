
import React, { useState } from "react";
import { Check } from "lucide-react";

const QUESTIONS = [
  { id: "q1", label: "Atendimento" },
  { id: "q2", label: "Tempo de espera" },
  { id: "q3", label: "Estrutura" },
  { id: "q4", label: "Satisfação geral" }
];

type Answered = Record<string, number> & { comment?: string; timestamp?: number };

type AnalysisSource = "gpt4" | "claude" | "gemini";
const ANALYSIS_LABELS = {
  gpt4: "GPT-4",
  claude: "Claude",
  gemini: "Gemini"
};

// Simula chamada IA (depois: trocar para fetch API real)
async function fakeAnalysis(source: AnalysisSource, dataset: Answered[]) {
  let result = "";
  const qtd = dataset.length;
  const med = (qid: string) => {
    const arr = dataset.map(d => d[qid]).filter(Boolean) as number[];
    return arr.length ? (arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(2) : "--";
  }
  const simComment = dataset.filter(x => x.comment?.length).slice(-3).map(x => `"${x.comment}"`).join("; ");
  if (source==="gpt4") result = `Média geral: ${med("q4")}. Pontos positivos: equipe atenciosa. Pontos a melhorar: tempo de espera em alguns relatos. Comentários recentes: ${simComment||'nenhum.'}`;
  if (source==="claude") result = `Notas altas para atendimento (${med("q1")}). Estrutura foi razoável (${med("q3")}). Recomenda-se detalhar sugestões nos comentários.`;
  if (source==="gemini") result = `Análise automática: A satisfação está em ${med("q4")}. "${simComment||'Nenhum comentário'}"`;
  await new Promise(r => setTimeout(r, 700 + Math.random() * 900));
  return result;
}

const ResultsDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<{[k in AnalysisSource]?: string}>({});
  const [loading, setLoading] = useState<{[k in AnalysisSource]?: boolean}>({});

  // Busca ou simula respostas públicas (depois trocar por Supabase)
  function getData(): Answered[] {
    return JSON.parse(localStorage.getItem("avaliaserv-data") || "[]");
  }
  const data = getData();
  const totals = QUESTIONS.map(q => {
    const scores = data.map(a => a[q.id]).filter(Boolean) as number[];
    return scores.length
      ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)
      : "--";
  });

  async function handleAnalysis(source: AnalysisSource) {
    setLoading(l => ({...l, [source]: true}));
    const result = await fakeAnalysis(source, data);
    setAnalyses(a => ({...a, [source]: result}));
    setLoading(l => ({...l, [source]: false}));
  }

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Médias/Notas */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[320px]">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Média das avaliações</h3>
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
          <span className="font-bold">{data.length}</span>
        </div>
      </div>

      {/* Coluna 2: Análises IA */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-green-900">Análise Inteligente <span className="text-sm text-muted-foreground">(simulada)</span></h3>
        
        <div className="flex gap-2 mb-4">
          {(["gpt4", "claude", "gemini"] as AnalysisSource[]).map(src => (
            <button
              key={src}
              disabled={loading[src]}
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
            <div key={src} className="bg-gray-50 rounded-lg px-4 py-3 min-h-[50px] border">
              <div className="text-xs font-bold text-green-800 mb-1">{ANALYSIS_LABELS[src]}</div>
              <div className={analyses[src] ? "" : "text-gray-400"}>
                {loading[src]
                  ? "Analisando dados…" 
                  : analyses[src] || "Clique no botão acima para gerar a análise."}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ResultsDashboard;
