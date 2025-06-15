
const comentariosFalsos = [
  "O atendimento foi excelente, a equipe foi muito atenciosa.",
  "Esperei mais de duas horas para ser atendido. Um absurdo!",
  "A limpeza do local estava impecável, tudo muito organizado.",
  "Fui tratado com muito respeito por todos os profissionais.",
  "A estrutura do posto de saúde precisa de reformas urgentes.",
  "Satisfação geral boa, mas o tempo de espera poderia melhorar.",
  "Nada a reclamar, fui muito bem atendido.",
  "A médica parecia com pressa e não me deu muita atenção.",
  "O banheiro estava sujo e sem papel.",
  "O processo foi rápido e eficiente, parabéns!",
  "Faltam médicos para atender a demanda.",
  "Equipamentos parecem antigos e mal conservados.",
  "O agendamento foi fácil, mas o atendimento demorou.",
  "Todos foram muito educados, desde a recepção até o médico.",
  "Poderia ter mais cadeiras na sala de espera."
];

export function generateFakeData(count = 50) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      nota_atendimento: Math.floor(Math.random() * 5) + 1,
      nota_espera: Math.floor(Math.random() * 5) + 1,
      nota_limpeza: Math.floor(Math.random() * 5) + 1,
      nota_respeito: Math.floor(Math.random() * 5) + 1,
      comentario: comentariosFalsos[Math.floor(Math.random() * comentariosFalsos.length)],
    });
  }
  return data;
}
