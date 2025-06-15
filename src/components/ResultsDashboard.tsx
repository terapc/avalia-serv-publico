
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateFakeData } from "@/lib/testData";
import { useResultsData } from "@/hooks/useResultsData";
import MetricsCard from "./results/MetricsCard";
import AnalysisCard from "./results/AnalysisCard";
import { ANALYSIS_SOURCES, AnalysisSource } from "./results/constants";

const ResultsDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<{[k in AnalysisSource]?: string}>({});
  const [resumos, setResumos] = useState<{[k in AnalysisSource]?: string}>({});
  const [loading, setLoading] = useState<{[k in AnalysisSource]?: boolean}>({});
  const [simulationLoading, setSimulationLoading] = useState<"zerar" | "gerar" | null>(null);

  const queryClient = useQueryClient();
  const { avaliacoes, isLoading, error, interactionCounts } = useResultsData();

  async function logInteraction(type: string) {
    await supabase.from("interacoes").insert({ tipo_interacao: type });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
  }

  async function handleAnalysis(source: AnalysisSource) {
    await logInteraction(`analisar_${source}`);
    setLoading(l => ({...l, [source]: true}));
    try {
      const { data: response, error } = await supabase.functions.invoke(`analyze-${source}`, {
        body: { avaliacoes: avaliacoes || [] },
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
    const { error } = await supabase.from("avaliacoes").delete().not("id", "is", null);
    if (error) {
      toast.error("Erro ao apagar os dados.", { description: error.message });
    } else {
      toast.success("Todos os dados de avaliação foram apagados!");
    }
    await queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
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
    await queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
    setSimulationLoading(null);
  }

  function handleDownloadPDF() {
    window.alert("Relatório em PDF será gerado em breve. (Funcionalidade simulada para apresentação)");
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Médias/Notas e Controles de Simulação */}
      <MetricsCard
        isLoading={isLoading}
        error={error}
        data={avaliacoes}
        interactionCounts={interactionCounts}
        simulationLoading={simulationLoading}
        handleGerarDados={handleGerarDados}
        handleZerarDados={handleZerarDados}
        handleDownloadPDF={handleDownloadPDF}
      />
      
      {/* Coluna 2: Análises IA */}
      <div className="flex flex-col gap-5">
        {ANALYSIS_SOURCES.map(src => (
          <AnalysisCard
            key={src}
            source={src}
            analysis={analyses[src]}
            resumo={resumos[src]}
            isAnalysisLoading={!!loading[src]}
            isDataLoading={isLoading}
            onAnalysis={handleAnalysis}
            interactionCount={interactionCounts[`analisar_${src}`] || 0}
          />
        ))}
      </div>
    </div>
  );
};
export default ResultsDashboard;
