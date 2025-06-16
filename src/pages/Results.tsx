
import ResultsDashboard from "@/components/ResultsDashboard";
import { useNavigate } from "react-router-dom";
import AvaliaServLogo from "@/components/AvaliaServLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Brain, Users } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center pt-6 pb-12 px-4">
        {/* Header */}
        <div className="mb-6">
          <AvaliaServLogo size={44} />
        </div>
        
        {/* Navigation and Title */}
        <div className="w-full max-w-6xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="self-start bg-white/80 hover:bg-white border-2 border-primary/20 hover:border-primary/40 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              Nova avaliação
            </Button>
            
            <div className="text-center lg:text-center flex-1">
              <div className="flex justify-center mb-2">
                <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-200 px-4 py-1.5">
                  Dashboard Público
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                Resultados em Tempo Real
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Análises inteligentes dos serviços públicos de saúde
              </p>
            </div>
            
            <div className="hidden lg:block w-32"></div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="w-full max-w-6xl mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <Users className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Dados Cidadãos</h3>
                  <p className="text-sm text-gray-600">
                    Avaliações anônimas e transparentes
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <Brain className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Múltiplas IAs</h3>
                  <p className="text-sm text-gray-600">
                    Análises de <span className="font-medium text-blue-700">GPT-4</span>, <span className="font-medium text-green-700">Claude</span> e <span className="font-medium text-cyan-700">Gemini</span>
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Gestão Pública</h3>
                  <p className="text-sm text-gray-600">
                    Relatórios para tomada de decisão
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="w-full max-w-6xl">
          <ResultsDashboard />
        </div>
      </div>
    </div>
  );
};

export default Results;
