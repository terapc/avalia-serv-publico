
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
      <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center w-full max-w-7xl my-8 gap-4">
        <div className="sm:justify-self-start">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Nova avaliação
          </Button>
        </div>
        <h2 className="text-2xl text-center font-bold text-primary drop-shadow order-first sm:order-none">Resultados Públicos</h2>
        <div className="hidden sm:block"></div>
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
