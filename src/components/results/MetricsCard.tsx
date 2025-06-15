
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FlaskConical, Trash2, Loader2, ArrowDown } from "lucide-react";
import { QUESTIONS, Answered } from "./constants";

interface MetricsCardProps {
  isLoading: boolean;
  error: Error | null;
  data: Answered[] | undefined;
  interactionCounts: { [key: string]: number };
  simulationLoading: "zerar" | "gerar" | null;
  handleGerarDados: () => void;
  handleZerarDados: () => void;
  handleDownloadPDF: () => void;
}

const calculateTotals = (data: Answered[] | undefined) => {
  return QUESTIONS.map(q => {
    if (!data) return "--";
    let scores: number[] = [];
    if (q.id === "q1") scores = data.map(a => a.nota_atendimento ?? 0).filter(Boolean);
    if (q.id === "q2") scores = data.map(a => a.nota_espera ?? 0).filter(Boolean);
    if (q.id === "q3") scores = data.map(a => a.nota_limpeza ?? 0).filter(Boolean);
    if (q.id === "q4") scores = data.map(a => a.nota_respeito ?? 0).filter(Boolean);
    return scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2) : "--";
  });
};

const MetricsCard: React.FC<MetricsCardProps> = ({
  isLoading,
  error,
  data,
  interactionCounts,
  simulationLoading,
  handleGerarDados,
  handleZerarDados,
  handleDownloadPDF,
}) => {
  const totals = calculateTotals(data);

  return (
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
              <TooltipContent>Gerar 50 registros de teste ({interactionCounts['gerar_dados'] || 0} usos)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" onClick={handleZerarDados} disabled={!!simulationLoading}>
                  {simulationLoading === 'zerar' ? <Loader2 className="animate-spin"/> : <Trash2 size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Apagar todos os dados ({interactionCounts['zerar_dados'] || 0} usos)</TooltipContent>
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
            <div className="mt-4 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                Total de avaliações: 
                <span className="font-bold">{data?.length || 0}</span>
              </div>
              <button onClick={handleDownloadPDF}
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-full font-semibold shadow hover:from-blue-500 hover:to-green-500 flex gap-2 items-center transition-colors text-sm"
                title="Baixar relatório em PDF"
              >
                <ArrowDown size={18} /> Baixar PDF do relatório
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
