
import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
const QUESTIONS = [
  { id: "q1", label: "Atendimento da equipe", help: "(Simpatia, respeito, clareza)" },
  { id: "q2", label: "Tempo de espera", help: "(Rapidez do atendimento)" },
  { id: "q3", label: "Estrutura do local", help: "(Limpeza, sinalização, conforto)" },
  { id: "q4", label: "Satisfação geral", help: "(Sua impressão global)" }
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

  function saveToLocal(data: any) {
    const saved = JSON.parse(localStorage.getItem("avaliaserv-data") || "[]");
    localStorage.setItem("avaliaserv-data", JSON.stringify([...saved, data]));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (anyMissing) {
      toast({ title: "Preencha todas as notas." });
      return;
    }
    setLoading(true);
    // Simula salvamento; depois trocar por Supabase
    setTimeout(() => {
      saveToLocal({
        ...answers,
        comment,
        timestamp: Date.now()
      });
      setLoading(false);
      toast({ title: "Avaliação enviada com sucesso!" });
      setAnswers({});
      setComment("");
      if (onFinish) onFinish();
    }, 600);
  };

  return (
    <form className="space-y-7" onSubmit={handleSubmit}>
      {QUESTIONS.map(q => (
        <div key={q.id} className="flex flex-col gap-1">
          <label className="font-medium text-base">{q.label}
            <span className="ml-2 text-xs text-muted-foreground">{q.help}</span>
          </label>
          <div className="flex gap-3 mt-1">
            {[1,2,3,4,5].map(n => (
              <label key={n} className={`cursor-pointer w-9 h-9 flex items-center justify-center rounded-full border ${answers[q.id] === n ? "bg-blue-500 text-white border-blue-500" : "bg-gray-50 hover:bg-blue-100 border-gray-300"}`}>
                <input
                  type="radio"
                  name={q.id}
                  value={n}
                  checked={answers[q.id] === n}
                  onChange={() => handleRadio(q.id, n)}
                  className="hidden"
                />
                {n}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="font-medium block mb-1">Comentário (opcional):</label>
        <textarea
          className="w-full rounded border border-gray-300 min-h-[64px] px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none transition"
          placeholder="Conte sua experiência. Sugestões, elogios, críticas..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={350}
        />
      </div>
      <button
        type="submit"
        className="bg-primary text-primary-foreground px-8 py-2 rounded-lg font-semibold shadow hover:brightness-95 active:brightness-90 transition min-w-[150px]"
        disabled={loading || anyMissing}
      >
        {loading ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
};

export default SurveyForm;
