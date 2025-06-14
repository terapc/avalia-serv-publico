
import ResultsDashboard from "@/components/ResultsDashboard";
import { useNavigate } from "react-router-dom";

const Results = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center pt-12">
      <div className="flex flex-row items-center w-full max-w-5xl mb-8">
        <button
          onClick={() => navigate("/")}
          className="text-primary hover:underline font-medium pl-2 pr-6 py-1"
        >&larr; Nova avaliação</button>
        <h2 className="mx-auto text-2xl font-bold text-primary drop-shadow">Resultados Públicos</h2>
      </div>
      <ResultsDashboard />
    </div>
  );
};
export default Results;
