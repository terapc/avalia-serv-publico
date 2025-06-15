
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import type { Answered } from "@/components/results/constants";

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

export function useResultsData() {
  const { data: avaliacoesData, isLoading: isAvaliacoesLoading, error: avaliacoesError } = useQuery({
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

  return {
    avaliacoes: avaliacoesData,
    isLoading: isAvaliacoesLoading,
    error: avaliacoesError,
    interactionCounts
  };
}
