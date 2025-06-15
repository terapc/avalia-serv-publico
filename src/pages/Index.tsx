
import { useNavigate } from "react-router-dom";
import SurveyForm from "@/components/SurveyForm";
import AvaliaServLogo from "@/components/AvaliaServLogo";
import { Button } from "@/components/ui/button";

const Apresentacao = () => (
  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg px-6 py-6 mb-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
    <h2 className="text-xl font-semibold text-blue-900 mb-2 text-center">Bem-vindo ao AvaliaServ Público!</h2>
    <ul className="text-base text-gray-700 space-y-2 text-left max-w-lg list-disc list-inside mx-auto">
      <li>
        <b>O que é o projeto:</b> sistema de avaliação da qualidade dos serviços públicos de saúde, focado na experiência real do cidadão.
      </li>
      <li>
        <b>Por que existe:</b> atende à <span className="underline decoration-green-400">Lei 13.460/2017</span>, promovendo a melhoria contínua dos serviços públicos com base em dados reais.
      </li>
      <li>
        <b>Como funciona:</b> Você responde perguntas rápidas. As respostas são salvas anonimamente no Supabase. Três inteligências artificiais (<span className="font-bold text-blue-700">GPT-4</span>, <span className="font-bold text-green-700">Claude</span>, <span className="font-bold text-cyan-700">Gemini</span>) analisam os dados sob diferentes óticas.
      </li>
      <li>
        <b>Destaques técnicos:</b> Edge functions, resumos automáticos, frontend responsivo e integração total com Supabase e GitHub.
      </li>
      <li>
        <b>Impacto esperado:</b> apoiar a gestão pública com relatórios em tempo real, criando oportunidades reais de melhoria pela voz do cidadão.
      </li>
    </ul>
  </div>
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="w-full max-w-4xl flex flex-col items-center mt-10 mb-8 px-4">
        <AvaliaServLogo size={56} />
        <Apresentacao />
        <div className="w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
          <h1 className="text-2xl font-bold text-primary mb-1 text-center">Avalie o serviço público de saúde!</h1>
          <p className="text-lg text-muted-foreground text-center mb-6">
            Suas respostas são anônimas e ajudam a melhorar a experiência de todos.
          </p>
          <SurveyForm onFinish={() => navigate("/resultados")} />
        </div>
        <Button
          onClick={() => navigate("/resultados")}
          variant="link"
          className="mt-6 text-lg"
        >
          Ver resultados públicos
        </Button>
      </div>
    </div>
  );
};

export default Index;
