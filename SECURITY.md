
# 🔒 Segurança no AvaliaServ Público

## 1. Proteção dos Dados dos Cidadãos

- Ativação do **Row Level Security (RLS)** na tabela `avaliacoes`
- Políticas de acesso definidas:
  - `insercao_publica`: permite inserção anônima com validação
  - `leitura_publica`: permite leitura pública dos dados de avaliação, sem dados sensíveis

## 2. Proteção das Funções (Edge Functions)

- As quatro funções (`analyze-gpt4`, `analyze-claude`, `analyze-gemini`, `resumo-ia`) agora exigem **JWT obrigatório** para qualquer execução externa.
- As chamadas internas entre funções utilizam o cabeçalho:
  - `Authorization: Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`

## 3. Validação Rigorosa de Entrada

- Notas (1 a 5) são validadas para tipo e intervalo
- Comentários com limite máximo de 350 caracteres
- Campos inesperados são rejeitados
- Limite de payload configurado para 1 MB

## 4. Controle de Erros e Logs

- Mensagens genéricas de erro: `"Erro ao processar os dados."`
- Logs registrados apenas no backend, sem exposição pública

## 5. Boas Práticas de Segurança Ativa

- Nenhuma chave de API está hardcoded
- Todas as variáveis sensíveis estão armazenadas no Supabase Secrets
- GitHub sincronizado apenas com código limpo, sem `.env` ou segredos
- CORS configurado corretamente nas funções

