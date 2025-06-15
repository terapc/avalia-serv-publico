
export const QUESTIONS = [
  { id: "q1", label: "Atendimento" },
  { id: "q2", label: "Tempo de espera" },
  { id: "q3", label: "Estrutura" },
  { id: "q4", label: "Satisfação geral" }
];

export type AnalysisSource = "gpt4" | "claude" | "gemini";

export const ANALYSIS_SOURCES: AnalysisSource[] = ["gpt4", "claude", "gemini"];

export const ANALYSIS_LABELS: Record<AnalysisSource, string> = {
  gpt4: "GPT-4",
  claude: "Claude",
  gemini: "Gemini"
};

export const ANALYSIS_COLORS: Record<AnalysisSource, string> = {
  gpt4: "from-blue-200 to-blue-100 border-blue-400",
  claude: "from-green-100 to-green-50 border-green-300",
  gemini: "from-cyan-100 to-blue-50 border-cyan-400"
};

export type Answered = {
  id: string;
  nota_atendimento: number | null;
  nota_espera: number | null;
  nota_limpeza: number | null;
  nota_respeito: number | null;
  comentario?: string;
  data_envio?: string;
};
