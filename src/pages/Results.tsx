
import ResultsDashboard from "@/components/ResultsDashboard";
import { useNavigate } from "react-router-dom";
import AvaliaServLogo from "@/components/AvaliaServLogo";

const Results = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center pt-8">
      <AvaliaServLogo size={44} />
      <div className="flex flex-row items-center w-full max-w-5xl my-8 gap-2">
        <button
          onClick={() => navigate("/")}
          className="text-primary hover:underline font-medium pl-2 pr-6 py-1"
        >&larr; Nova avaliação</button>
        <h2 className="mx-auto text-2xl font-bold text-primary drop-shadow">Resultados Públicos</h2>
      </div>
      <div className="w-full max-w-3xl mb-6">
        <div className="rounded-xl bg-white/95 shadow p-4 text-center text-md font-semibold text-blue-900">
          Veja o que dizem os cidadãos sobre os serviços públicos de saúde.<br/>
          Cada análise abaixo foi gerada por uma IA diferente, trazendo múltiplas visões para a gestão.
        </div>
      </div>
      <ResultsDashboard />
    </div>
  );
};
export default Results;
