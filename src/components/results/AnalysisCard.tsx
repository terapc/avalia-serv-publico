
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AnalysisSource, ANALYSIS_LABELS, ANALYSIS_COLORS } from "./constants";

interface AnalysisCardProps {
  source: AnalysisSource;
  analysis?: string;
  resumo?: string;
  isAnalysisLoading: boolean;
  isDataLoading: boolean;
  onAnalysis: (source: AnalysisSource) => void;
  interactionCount: number;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  source,
  analysis,
  resumo,
  isAnalysisLoading,
  isDataLoading,
  onAnalysis,
  interactionCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const label = ANALYSIS_LABELS[source];
  const colors = ANALYSIS_COLORS[source];
  const textColor = source === "gpt4" ? "text-blue-800" : source === "claude" ? "text-green-700" : "text-cyan-700";
  
  return (
    <div className={`bg-gradient-to-br ${colors} rounded-xl shadow border px-5 py-5 flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-bold text-lg ${textColor}`}>
          {label}
        </span>
        <Button
          disabled={isAnalysisLoading || isDataLoading}
          onClick={() => onAnalysis(source)}
          variant="secondary"
          size="sm"
          className={`ml-2 flex items-center gap-2 px-4 py-1.5 rounded font-semibold border border-opacity-40 bg-white/80 hover:bg-white transition text-sm ${
            isAnalysisLoading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {analysis ? <Check size={16} /> : null}
          {isAnalysisLoading ? "Gerando..." : `Analisar com ${label}`}
          <span className="text-xs opacity-80">({interactionCount})</span>
        </Button>
      </div>
      <div>
        {isAnalysisLoading ? (
          <div className="text-gray-600 italic py-2">Analisando dados…</div>
        ) : resumo ? (
          <div>
            <div className="mb-2 text-gray-800">{resumo}</div>
            <button
              className="text-blue-700 text-xs font-semibold underline"
              onClick={() => setIsOpen(o => !o)}
            >
              {isOpen
                ? "Ocultar análise completa"
                : "Ver análise completa"}
            </button>
            {isOpen &&
              <div className="mt-2 text-gray-800 bg-white/70 rounded p-3 animate-fade-in whitespace-pre-line border text-sm">
                {analysis}
              </div>
            }
          </div>
        ) : (
          <div className="text-gray-500 text-sm py-2">Clique no botão acima para gerar a análise desta IA.</div>
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
