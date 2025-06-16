
import { useNavigate } from "react-router-dom";
import SurveyForm from "@/components/SurveyForm";
import AvaliaServLogo from "@/components/AvaliaServLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, BarChart3, Shield } from "lucide-react";

const Apresentacao = () => (
  <div className="max-w-6xl mx-auto mb-12">
    <Card className="bg-gradient-to-br from-blue-50/80 to-green-50/80 border-0 shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-200 px-4 py-1.5 text-sm font-medium">
            Sistema Oficial de Avaliação
          </Badge>
        </div>
        <CardTitle className="text-2xl lg:text-3xl font-bold text-blue-900 mb-2">
          Bem-vindo ao AvaliaServ Público
        </CardTitle>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Transforme sua experiência nos serviços públicos de saúde em dados que geram melhorias reais
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-xl border border-white/20">
            <CheckCircle className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">O que é</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sistema de avaliação da qualidade dos serviços públicos de saúde, focado na experiência real do cidadão
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-xl border border-white/20">
            <Shield className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Por que existe</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Atende à <span className="font-medium text-green-700">Lei 13.460/2017</span>, promovendo melhoria contínua com base em dados reais
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-xl border border-white/20">
            <BarChart3 className="h-8 w-8 text-cyan-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Como funciona</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Respostas anônimas analisadas por três IAs: <span className="font-medium text-blue-700">GPT-4</span>, <span className="font-medium text-green-700">Claude</span> e <span className="font-medium text-cyan-700">Gemini</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-xl border border-white/20">
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Impacto</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Relatórios em tempo real que apoiam a gestão pública e criam oportunidades reais de melhoria
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-white/70 rounded-xl border border-white/20">
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              Edge Functions
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
              Supabase + GitHub
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
              Frontend Responsivo
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              Resumos Automáticos
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center pt-8 pb-12 px-4">
        <div className="mb-8">
          <AvaliaServLogo size={56} />
        </div>
        
        <Apresentacao />
        
        <div className="w-full max-w-4xl">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl lg:text-3xl font-bold text-primary mb-3">
                Avalie o serviço público de saúde
              </CardTitle>
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">
                  Suas respostas são anônimas e ajudam a melhorar a experiência de todos
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Demonstração:</span> A página de resultados é populada com dados fictícios
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <SurveyForm onFinish={() => navigate("/resultados")} />
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={() => navigate("/resultados")}
            variant="outline"
            size="lg"
            className="text-lg px-8 py-3 bg-white/80 hover:bg-white border-2 border-primary/20 hover:border-primary/40 transition-all duration-200"
          >
            Ver resultados públicos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
