
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
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
  const iconColor = source === "gpt4" ? "text-blue-600" : source === "claude" ? "text-green-600" : "text-cyan-600";
  
  return (
    <Card className={`bg-gradient-to-br ${colors} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center`}>
              <Sparkles className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className={`text-lg font-bold ${textColor}`}>
                {label}
              </CardTitle>
              <p className="text-xs text-gray-600 mt-1">
                Análise especializada por IA
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Button
              disabled={isAnalysisLoading || isDataLoading}
              onClick={() => onAnalysis(source)}
              size="sm"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white/90 hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg ${
                isAnalysisLoading ? "opacity-60 pointer-events-none" : ""
              } ${textColor}`}
            >
              {isAnalysisLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : analysis ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isAnalysisLoading ? "Gerando..." : `Analisar`}
            </Button>
            
            <Badge variant="secondary" className="bg-white/70 text-gray-700 text-xs">
              {interactionCount} usos
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isAnalysisLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-500" />
              <p className="text-gray-600 font-medium">Analisando dados...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : resumo ? (
          <div className="space-y-4">
            <div className="p-4 bg-white/70 rounded-lg border border-white/20">
              <p className="text-gray-800 leading-relaxed">{resumo}</p>
            </div>
            
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
              >
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar análise completa
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver análise completa
                  </>
                )}
              </Button>
            </div>
            
            {isOpen && (
              <div className="mt-4 p-4 bg-white/90 rounded-lg border border-white/30 animate-fade-in">
                <div className="max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-line text-sm text-gray-800 leading-relaxed">
                    {analysis}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">Análise não executada</p>
            <p className="text-sm text-gray-500">
              Clique no botão "Analisar" para gerar insights desta IA
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisCard;
