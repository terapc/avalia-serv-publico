
import ResultsDashboard from "@/components/ResultsDashboard";
import { useNavigate } from "react-router-dom";
import AvaliaServLogo from "@/components/AvaliaServLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center pt-8 px-4">
      <AvaliaServLogo size={44} />
      <div className="flex flex-row items-center w-full max-w-7xl my-8">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Nova avaliação
        </Button>
        <h2 className="mx-auto text-2xl font-bold text-primary drop-shadow -translate-x-1/2 left-1/2 relative">Resultados Públicos</h2>
      </div>
      <div className="w-full max-w-7xl mb-6">
        <div className="rounded-xl bg-white/95 shadow p-4 text-center text-md font-semibold text-blue-900">
          Veja o que dizem os cidadãos sobre os serviços públicos de saúde.<br/>
          Cada análise abaixo foi gerada por uma IA diferente, trazendo múltiplas visões para a gestão.
        </div>
      </div>
      <div className="w-full max-w-7xl">
        <ResultsDashboard />
      </div>
    </div>
  );
};
export default Results;
