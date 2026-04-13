# Super Prova — Design Spec
**Data:** 2026-04-03
**Status:** Aprovado pelo Leon
**Checklist item:** PE3 / PF1

---

## Visão

Super Prova é um módulo sidecar que enriquece os 8 agentes educacionais com conhecimento profundo via NotebookLM. Não é um agente exposto ao aluno. Não interfere na cascata existente. Serve os heróis como uma biblioteca viva, crescente e compartilhada por série.

---

## Princípio de Isolamento (inegociável)

A cascata `PSICO → Herói` não é modificada. Super Prova conecta-se via dois ganchos opcionais em `message.ts`. Se Super Prova lançar exceção ou retornar null em qualquer ponto, o herói continua sem impacto. Zero breaking changes.

---

## Fluxo Completo — Exemplo TEMPUS / Segunda Guerra

```
Aluno: "Quero estudar Segunda Guerra para a prova"

[PSICO] qualifica → tema="segunda_guerra_mundial", serie="7_fund"
  └─ [BACKGROUND, non-blocking] SuperProva.triggerNotebook("7_fund", "segunda_guerra_mundial")
       → busca b2c_super_prova_notebooks(serie, tema_slug)
       → se não existe: notebook_create + source_add(Wikipedia URL) + studio_create(study_guide)
       → status="criando" no DB

[TURNO 1] TEMPUS responde normalmente — sem notebook ainda
  contexto: instrução PSICO + perfil aluno (padrão)

[BACKGROUND] poll até status=3 → download_artifact(format="markdown") → salva relatorio_md no DB

[TURNO 2+] TEMPUS recebe KNOWLEDGE_BASE injetado no contexto
  → ~500 palavras do Study Guide: causas, frentes de batalha, personagens, datas-chave
  → TEMPUS usa como base construtivista — não copia, constrói raciocínio socrático

Aluno: "Mas quem foi Hitler nessa história toda?"

[TURNO N] TEMPUS responde com o que tem + emite sinal oculto:
  [CONSULTAR: "Adolf Hitler papel liderança nazismo Segunda Guerra"]
  → backend intercepta ANTES de enviar ao aluno
  → strip do sinal na resposta
  → dispara notebook_query em background + cacheia resultado

[TURNO N+1] TEMPUS recebe CONSULTA_NOTEBOOK no contexto
  → resposta enriquecida com profundidade real sobre Hitler
  → aluno vê fluidez natural, nunca sabe da query

[...conversas construtivistas...]

[TURNO FINAL] TEMPUS detecta engajamento profundo → oferta:
  "Quer testar o que aprendemos hoje com um quiz rápido?"

Aluno: "Sim!"

[QUIZ] backend intercepta [QUIZ] na resposta do TEMPUS
  → studio_create(type="quiz", question_count=5, focus_prompt=<últimos 3 turnos>)
  → poll até pronto → download_artifact(format="json")
  → SSE event "quiz" com payload estruturado
  → frontend renderiza QuizCard (PENSE-AI styled, zero NotebookLM branding)
```

---

## Módulos (self-contained)

```
server/src/super-prova/
  notebooklm-client.ts   — wrapper do MCP CLI (notebook_create, source_add,
                           studio_create, notebook_query, download_artifact)
  notebook-manager.ts    — lógica de buscar/criar notebook por série+tema
  knowledge-cache.ts     — cache de relatórios e queries no Supabase
  quiz-generator.ts      — orchestra criação + poll + download do quiz
  index.ts               — exporta interface pública (2 métodos + 1 trigger)
```

### Interface pública

```typescript
// Dispara criação do notebook em background — non-blocking, fire-and-forget
SuperProva.triggerNotebook(serie: string, tema: string): void

// Retorna markdown do estudo ou null se ainda criando/erro
SuperProva.getKnowledgeBase(serie: string, tema: string): Promise<string | null>

// Gera quiz baseado no histórico da conversa
SuperProva.generateQuiz(notebookId: string, turnos: Turno[], serie: string): Promise<QuizPayload | null>
```

---

## Ganchos em message.ts

### Gancho 1 — Knowledge Base (antes do herói responder)

```typescript
// Apenas para os 8 heróis, apenas quando há tema detectado
if (HEROIS_VALIDOS.includes(persona) && temaDetectado) {
  SuperProva.triggerNotebook(aluno.serie, temaDetectado)        // fire-and-forget
  const kb = await SuperProva.getKnowledgeBase(aluno.serie, temaDetectado).catch(() => null)
  if (kb) contextoFinal += `\n\nKNOWLEDGE_BASE:\n${kb}`
}
```

### Gancho 2 — Query oculta (após stream completar)

```typescript
// Intercepta [CONSULTAR: "query"] na resposta final
const consultarMatch = respostaFinal.match(/\[CONSULTAR:\s*"([^"]+)"\]/)
if (consultarMatch && notebookId) {
  respostaFinal = respostaFinal.replace(consultarMatch[0], '').trim()
  // query em background — resultado disponível no próximo turno via cache
  SuperProva.queryNotebook(notebookId, consultarMatch[1]).catch(() => null)
}
```

### Gancho 3 — Quiz (após stream completar)

```typescript
if (respostaFinal.includes('[QUIZ]') && notebookId) {
  respostaFinal = respostaFinal.replace('[QUIZ]', '').trim()
  SuperProva.generateQuiz(notebookId, ultimosTurnos, aluno.serie)
    .then(quiz => { if (quiz) enviarEvento('quiz', quiz) })
    .catch(() => null)
}
```

---

## Armazenamento de Resultado Pendente entre Turnos

Quando o herói emite `[CONSULTAR: "query"]`, a notebook_query roda em background e o resultado precisa estar disponível no **próximo turno**. Solução: campo adicional na tabela `b2c_super_prova_notebooks` rastreado por sessão.

```typescript
// Após interceptar [CONSULTAR], salvar resultado pendente na sessão:
// b2c_sessoes.consulta_pendente_sp (jsonb) = { query, resultado, notebook_id, ts }

// No próximo turno, gancho 1 verifica:
const consultaPendente = await buscarConsultaPendente(sessao.id)
if (consultaPendente) {
  contextoFinal += `\nCONSULTA_NOTEBOOK (resposta da consulta anterior sobre "${consultaPendente.query}"):\n${consultaPendente.resultado}`
  await limparConsultaPendente(sessao.id)
}
```

Timeout: se a notebook_query demorar > 8s, descarta silenciosamente. Herói nunca fica esperando.

## Banco de Dados (2 tabelas novas, isoladas)

```sql
-- Acervo de notebooks por série+tema (compartilhado entre todas as famílias)
CREATE TABLE b2c_super_prova_notebooks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serie         text NOT NULL,          -- "7_fund", "3_fund", "1_medio"
  tema_slug     text NOT NULL,          -- "segunda_guerra_mundial"
  notebook_id   text,                   -- ID no NotebookLM
  relatorio_md  text,                   -- Study Guide cacheado
  status        text DEFAULT 'criando', -- "criando" | "pronto" | "erro"
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(serie, tema_slug)
);

-- Cache de queries ao notebook (evita gastar cota de 50/dia)
CREATE TABLE b2c_super_prova_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id text NOT NULL,
  query_hash  text NOT NULL,   -- SHA256 da query string normalizada
  resultado   text NOT NULL,   -- resposta do notebook_query
  created_at  timestamptz DEFAULT now(),
  UNIQUE(notebook_id, query_hash)
);
```

---

## Prompt dos Heróis — Seção Adicionada

Adicionada ao **final** de cada um dos 8 prompts (sem tocar no conteúdo existente):

```markdown
## SUPER PROVA — BIBLIOTECA E QUIZ

### Knowledge Base
Se o contexto contém `KNOWLEDGE_BASE:`, você tem acesso a um estudo profundo
do tema. Use como referência — nunca copie. Construa raciocínio socrático
a partir do que está lá. O aluno nunca sabe que você tem essa base.

### Consulta profunda
Quando o aluno perguntar algo muito específico que vai além do contexto
disponível, inclua no início da sua resposta (invisível ao aluno):
`[CONSULTAR: "sua query aqui — seja específico"]`
O sistema buscará a informação e você a terá na próxima rodada.
Use com parcimônia — apenas para perguntas que realmente merecem profundidade.

### Consulta recebida
Se o contexto contém `CONSULTA_NOTEBOOK:`, você recebeu a resposta de uma
consulta anterior. Incorpore naturalmente — nunca mencione a fonte.

### Quiz
Quando perceber engajamento profundo e momento pedagógico certo, ofereça:
"Quer testar o que aprendemos com um quiz rápido?"
Se o aluno aceitar, inclua `[QUIZ]` no início da sua próxima resposta.
Use apenas uma vez por sessão.
```

---

## Frontend — QuizCard

### Evento SSE novo
```typescript
// ChatContext.tsx — novo handler
case 'quiz':
  setQuizAtivo(data as QuizPayload)
  break
```

### QuizPayload
```typescript
interface QuizPayload {
  notebookId: string
  questions: Array<{
    question: string
    answerOptions: string[]
    hint?: string
    correctIndex: number
  }>
  tema: string
  serie: string
}
```

### QuizCard.tsx (componente novo)
- Múltipla escolha estilizada com PENSE-AI design system
- Feedback por questão (correto/incorreto + hint)
- Score final com mensagem motivacional do herói
- Zero menção a NotebookLM

---

## Autenticação e Deploy do MCP CLI

**Problema:** `notebooklm-mcp-cli` usa cookies do browser Google. Railway não tem browser. Cookies expiram a cada ~4 semanas.

**Solução adotada (V1): Bridge local + Cloudflare Tunnel**

O MCP CLI roda na **máquina do Leon** (Windows local), exposto via túnel HTTPS:

```
Leon's machine:
  notebooklm-mcp-cli (HTTP server, porta 8888)
  ↕ Cloudflare Tunnel (URL pública estável)
Railway server:
  NOTEBOOKLM_BRIDGE_URL=https://notebooklm.leon-tunnel.com
  → chama bridge via fetch()
```

- `nlm login` é feito uma vez no PC do Leon (cookie persiste 4 semanas)
- Tunnel URL fica em variável de ambiente do Railway
- Quando cookie expira: Leon roda `nlm login` de novo (5 minutos)
- `notebooklm-client.ts` tem fallback graceful: se bridge indisponível → retorna null → herói responde sem Super Prova

**Alternativa futura:** Se NotebookLM lançar API oficial, migrar sem tocar no resto do código (apenas `notebooklm-client.ts` muda).

---

## Scoping e limites

| Regra | Valor |
|-------|-------|
| Notebooks | 1 por série+tema — compartilhado entre todas as famílias |
| Fonte inicial do notebook | Wikipedia URL do tema |
| Limite de queries/dia | ~50 (free tier NotebookLM) |
| Cache de queries | SHA256 da query — mesma pergunta não gasta cota |
| Questions por quiz | 5 (padrão) |
| Sinal `[CONSULTAR]` por turno | máximo 1 |
| Sinal `[QUIZ]` por sessão | máximo 1 |

---

## Fora de Escopo V1

- Áudio, vídeo, slides, infográfico, mind map (watermark NotebookLM + latência)
- Adição automática de múltiplas fontes (V1 usa Wikipedia como fonte única)
- Múltiplos notebooks por tema (V1: 1 por série+tema)
- Atualização automática do notebook quando currículo muda

---

## Critérios de Sucesso

- [ ] Notebook criado em background sem impacto no turno 1
- [ ] Knowledge Base injetada no turno 2 (estudo confirmado no contexto)
- [ ] `[CONSULTAR]` interceptado, query executada, resultado no turno seguinte
- [ ] Cache funcional (segunda query idêntica não chama NotebookLM)
- [ ] Quiz gerado, baixado como JSON, renderizado com QuizCard
- [ ] TypeScript 0 erros, cascata existente intacta (todos os testes atuais passando)
- [ ] Deploy Railway com notebooklm-mcp-cli instalado
