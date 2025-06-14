
import { useNavigate } from "react-router-dom";
import SurveyForm from "@/components/SurveyForm";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-10 space-y-8 mt-12 mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">AvaliaServ Público</h1>
        <p className="text-lg text-muted-foreground text-center mb-6">
          Avalie o serviço público de saúde! Suas respostas são anônimas e ajudam a melhorar a experiência de todos.
        </p>
        <SurveyForm onFinish={() => navigate("/resultados")} />
      </div>
      <button
        onClick={() => navigate("/resultados")}
        className="text-primary underline hover:text-blue-700 mt-4"
      >
        Ver resultados públicos
      </button>
    </div>
  );
};

export default Index;
