
import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

const QUESTIONS = [
  { id: "q1", label: "Atendimento da equipe", help: "Simpatia, respeito, clareza na comunicação" },
  { id: "q2", label: "Tempo de espera", help: "Rapidez e organização do atendimento" },
  { id: "q3", label: "Estrutura do local", help: "Limpeza, sinalização, conforto das instalações" },
  { id: "q4", label: "Satisfação geral", help: "Sua impressão global sobre o serviço" }
];

type SurveyFormProps = {
  onFinish?: () => void
};

const SurveyForm: React.FC<SurveyFormProps> = ({ onFinish }) => {
  const [answers, setAnswers] = useState<{ [id: string]: number }>({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRadio = (qid: string, value: number) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const anyMissing = QUESTIONS.some(q => !answers[q.id]);

  async function saveToSupabase(data: any) {
    const registro = {
      nota_atendimento: data.q1,
      nota_espera: data.q2,
      nota_limpeza: data.q3,
      nota_respeito: data.q4,
      comentario: data.comment,
      data_envio: new Date().toISOString(),
    };
    const { error } = await supabase.from("avaliacoes").insert([registro]);
    return error === null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (anyMissing) {
      toast({ title: "Preencha todas as notas." });
      return;
    }
    setLoading(true);
    const sucesso = await saveToSupabase({
      ...answers,
      comment,
      timestamp: Date.now(),
    });
    setLoading(false);
    if (sucesso) {
      toast({ title: "Avaliação enviada com sucesso!" });
      setAnswers({});
      setComment("");
      if (onFinish) onFinish();
    } else {
      toast({ title: "Erro ao enviar. Tente novamente mais tarde." });
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return "bg-red-500 hover:bg-red-600 border-red-500";
    if (score <= 3) return "bg-orange-500 hover:bg-orange-600 border-orange-500";
    if (score <= 4) return "bg-yellow-500 hover:bg-yellow-600 border-yellow-500";
    return "bg-green-500 hover:bg-green-600 border-green-500";
  };

  const getScoreLabel = (score: number) => {
    if (score <= 2) return "Insatisfeito";
    if (score <= 3) return "Regular";
    if (score <= 4) return "Bom";
    return "Excelente";
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="grid gap-6">
        {QUESTIONS.map((q, index) => (
          <Card key={q.id} className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        {index + 1}
                      </Badge>
                      <Label className="text-base font-semibold text-gray-800">
                        {q.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9">
                      {q.help}
                    </p>
                  </div>
                  {answers[q.id] && (
                    <Badge variant="secondary" className="ml-4">
                      {getScoreLabel(answers[q.id])}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2 ml-9">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleRadio(q.id, n)}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-semibold transition-all duration-200 transform hover:scale-105 ${
                        answers[q.id] === n 
                          ? `${getScoreColor(n)} text-white shadow-lg` 
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground ml-9">
                  <span>Muito ruim</span>
                  <span>Excelente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-green-50/30 to-transparent border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <Label className="text-base font-semibold text-gray-800 mb-3 block">
            Comentário adicional (opcional)
          </Label>
          <Textarea
            className="min-h-[100px] border-2 focus:border-green-400 transition-colors"
            placeholder="Conte sua experiência... Sugestões, elogios, críticas construtivas ou detalhes que possam ajudar na melhoria do serviço."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={350}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              Seu comentário é anônimo e ajuda na melhoria contínua
            </p>
            <p className="text-xs text-muted-foreground">
              {comment.length}/350
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button
          type="submit"
          size="lg"
          className="px-12 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          disabled={loading || anyMissing}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Enviar avaliação
            </>
          )}
        </Button>
      </div>
      
      {anyMissing && (
        <div className="text-center">
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
            Por favor, avalie todos os itens acima para continuar
          </p>
        </div>
      )}
    </form>
  );
};

export default SurveyForm;
