# CHECKLIST DO PROJETO — Super Agentes V1.0

> **Regra:** A cada task concluída, marcar [x]. A cada fase concluída com Gate passando, marcar o Gate.
> **Última atualização:** 2026-04-04 (BLOCO 4 MODO PAI aprovado + bug crítico dois estados corrigido + BUG-57 fix — 2 pushes pendentes)

---

## FASE 1: Fundação Backend

- [x] **1.1** Scaffold do projeto server (package.json, tsconfig, .env, index.ts mínimo)
- [x] **1.2** Camada de banco b2c_ (supabase.ts, persistence.ts, auth-queries.ts, usage-queries.ts)
- [x] **1.3** Core modules (router.ts 9 categorias, llm.ts envelope GESTOR, context.ts MODO PAI/FILHO, metrics.ts)
- [x] **1.4** Rotas auth (POST /api/auth/login JWT, POST /api/auth/select-profile PIN)
- [x] **1.5** Endpoint /api/message SSE (8 heróis, cascata, auth JWT, limite uso, agente_override)
- [x] **1.6** Personas copiadas (10 arquivos .md em server/src/personas/)
- [x] **1.T** Scripts de teste Gate 1 (gate1-backend.test.ts + helpers)
- [x] **1.SQL** Migração SQL aplicada no Supabase (tabelas b2c_)
- [x] **GATE 1** — Todos os testes passando ✅ (21/21 — 2026-03-12)

### Arquivos Fase 1

| Arquivo | Status | Typecheck |
|---------|--------|-----------|
| server/package.json | ✅ | - |
| server/tsconfig.json | ✅ | - |
| server/.env | ✅ | - |
| server/src/index.ts | ✅ | ✅ |
| server/src/db/supabase.ts | ✅ | ✅ |
| server/src/db/persistence.ts | ✅ | ✅ |
| server/src/db/auth-queries.ts | ✅ | ✅ |
| server/src/db/usage-queries.ts | ✅ | ✅ |
| server/src/core/router.ts | ✅ | ✅ |
| server/src/core/llm.ts | ✅ | ✅ |
| server/src/core/context.ts | ✅ | ✅ |
| server/src/core/metrics.ts | ✅ | ✅ |
| server/src/routes/auth.ts | ✅ | ✅ |
| server/src/routes/message.ts | ✅ | ✅ |
| server/src/personas/*.md (10) | ✅ | - |
| server/tests/gate1-backend.test.ts | ✅ | ✅ |
| server/tests/helpers/api-client.ts | ✅ | ✅ |
| server/tests/helpers/seed-data.ts | ✅ | ✅ |

---

## FASE 2: Agentes — 8 Professores + Modos

- [x] **2.1** MODO PAI nos 8 heróis + PSICO (adicionar seção nos .md)
- [x] **2.2** Integrar SUPERVISOR para pais (agente_override, resumo automático)
- [x] **2.3** Expandir instrucaoFormatoPorPersona (few-shot PSICO, formatos JSON)
- [x] **2.T** Scripts de teste Gate 2
- [x] **GATE 2** — Todos os testes passando ✅ (13/13 — 2026-03-12)

---

## FASE 2.5: Workshop PROFESSOR_IA ✅ CONCLUÍDO (2026-03-31)

- [x] **2.5.1** Sessão de design colaborativo com Leon — brainstorm 4 perguntas + spec aprovada
- [x] **2.5.2** Criar prompt PROFESSOR_IA.md — metodologia PENSE-AI completa
- [x] **2.5.3** Integrar no sistema (router, llm, interface, Qdrant, CRON, DB migration)
- [x] **2.5.4** DB migration: `b2c_qdrant_refs.responsavel_id` — jornada pai por responsável
- [x] **2.5.5** Memory loop: `buscarContextoProfessorIA` + injeção em message.ts
- [x] **2.5.T** Testes: cron-professor-ia.test.ts 6/6 passando, TypeScript 0 erros
- [x] **2.5.6** Google Search grounding (Gemini nativo) — `tools: [{ googleSearch: {} }]` em chamarLLMStream para PROFESSOR_IA + SSE `search` event + guardrail no prompt (2026-03-31)
- [ ] **PIA-WS5 [V2]** Glossário auto-melhorável — `b2c_professor_ia_glossario` Supabase + enriquecimento via resultados de busca reais
- [x] **BUG-52** Cor PROFESSOR_IA no header: teal → âmbar (`#B45309` / `#3B1A00`) ✅ 2026-04-01
- [x] **BUG-51** Supervisor injeta lista de filhas + Qdrant da filha selecionada + instrução multi-filho no prompt ✅ 2026-04-01

---

## FASE 3: Frontend — Vite + React

- [x] **3.1** Scaffold Vite + React (SPA) — Vite 8 + React 18 + TS + Tailwind
- [x] **3.2** Tela de login + seletor de perfil + PIN modal
- [x] **3.3** Chat com SSE streaming (3 interfaces: fundamental, médio, pai)
- [x] **3.4** Menu lateral overlay (Super Agentes / Supervisor / Professor IA / seletor filho)
- [x] **3.5** Imagens institucionais integradas (Logo_SuperAgentesPenseAI + buble)
- [x] **3.6** Deploy Railway funcionando (Vite 8→6, variáveis de ambiente)
- [x] **3.7** Visual polish: cores por perfil, cards brancos, logo retangular, fix Professor IA
- [x] **3.T** Scripts de teste Gate 3 (6 smoke tests)
- [x] **GATE 3** — Todos os testes passando ✅ (6/6 — 2026-03-12)
- [x] **DEPLOY** — App rodando em produção no Railway ✅ (2026-03-13)

### Arquivos Fase 3

| Arquivo | Status | Typecheck |
|---------|--------|-----------|
| web/package.json | ✅ | - |
| web/tsconfig.json | ✅ | - |
| web/vite.config.ts | ✅ | ✅ |
| web/tailwind.config.js | ✅ | - |
| web/index.html | ✅ | - |
| web/src/main.tsx | ✅ | ✅ |
| web/src/App.tsx | ✅ | ✅ |
| web/src/types.ts | ✅ | ✅ |
| web/src/constants.ts | ✅ | ✅ |
| web/src/api/client.ts | ✅ | ✅ |
| web/src/api/auth.ts | ✅ | ✅ |
| web/src/api/chat.ts | ✅ | ✅ |
| web/src/contexts/AuthContext.tsx | ✅ | ✅ |
| web/src/contexts/ChatContext.tsx | ✅ | ✅ |
| web/src/components/*.tsx (10) | ✅ | ✅ |
| web/src/pages/LoginPage.tsx | ✅ | ✅ |
| web/src/pages/ChatPage.tsx | ✅ | ✅ |
| web/src/__tests__/gate3-smoke.test.tsx | ✅ | ✅ |
| web/public/heroes/ (31 imgs) | ✅ | - |
| web/public/logo.png + logo-buble.png | ✅ | - |

---

## FASE 4: Infraestrutura — CRON, Qdrant, Limites

- [x] **4.1** CRON semanal (flush turnos → Qdrant → cleanup)
- [x] **4.2** Integração Qdrant (embeddings semanais)
- [x] **4.3** Controle de dispositivos simultâneos
- [x] **4.4** Limite suave completo (25 interações OU 5 turnos) + bug fix turnos_completos
- [x] **4.T** Scripts de teste Gate 4 (12 testes)
- [x] **GATE 4** — Todos os testes passando ✅ (12/12 — 2026-03-13)
- [x] **4.5** Gate 5 E2E — Validação dos 8 agentes com LLM-as-judge (14/14, média 9.3/10)
  - [x] Bug fix: "revolução"→"evolução" substring (reordenar historia antes de ciencias)
  - [x] Bug fix: "me conta"→"conta" (refinar keywords matematica)
  - [x] Bug fix: gemini-2.0-flash deprecated → gemini-2.5-flash
  - [x] Bug fix: PSICO heroi_escolhido hallucination → keyword override
  - [x] Bug fix: session state pollution → limparSessoesAluno()
  - [x] **GATE 5 E2E** — 14/14 testes passando ✅ (2026-03-13)

### Hotfixes Produção (2026-03-13)

- [x] **HF1** Build: personas .md não copiadas para dist/ (`tsc` só copia .ts)
- [x] **HF2** JSON bruto na tela: LLM usa campos variáveis (`mensagem_ao_aluno` etc.)
- [x] **HF3** Cascata falha: LLM usa `agente_destino` + typos de nomes (`VERBETA`)
- [x] **HF4** Limite 5 turnos = 5 mensagens (turno só incrementa em troca de matéria)
- [x] **HF5** Logo login pequeno (h-16→h-32)

### UX Melhorias (2026-03-13)

- [x] **UX1** Markdown rico (remark-gfm: tabelas, código, blockquotes)
- [x] **UX2** CSS chat-bubble-content (formatação visual completa)
- [x] **UX3** Typing effect (useTypingEffect: revelação gradual com pausa entre parágrafos)

### Polimento Pré-Venda — Bloco A: Bugs Críticos (2026-03-14)

- [x] **PA1** Fix JSON leaking no stream dos heróis (buffer completo + extract no final)
- [x] **PA2** Sistema de anti-keywords no router (blocklist por tema — ideia Leon)
- [x] **PA3** Logo herói no header h-12 → h-16 (igualar buble)

### Polimento Pré-Venda — Bloco B: UX de Chat (2026-03-14)

- [x] **PB1** Sentence-per-bubble (splitSentences no ChatBubble, avatar só no 1º balão)
- [x] **PB2** Typing effect mais lento (CHARS 3→2, TICK 25→35ms, PAUSE 400→800ms, FLUSH 15→8)
- [x] **PB3** Nome do usuário no topo do SlideMenu (nome + tipo perfil)
- [x] **PB4** EmptyState dinâmico por agente (agenteMenu no ChatContext, textos pai/filho)

### Polimento Pré-Venda — Bloco C: Refinamento de Prompts (2026-03-14)

- [x] **PC1** NEURON: permissão para educação sexual científica (seção SEGURANÇA)
- [x] **PC2** PSICOPEDAGOGICO: antever temas sexuais por idade no plano (7º+ / 6º- / risco)
- [x] **PC3** Demais heróis: proibição centralizada em construirEnvelopeGestor (llm.ts)

### Polimento Pré-Venda — Bloco D: Visual Refactor V5 (2026-03-14/15)

- [x] **PD1** Protótipo HTML (prototipo-visual-refactor.html) — aprovado por Leon
- [x] **PD2** Implementação 18 tasks (Plus Jakarta Sans, CSS tokens, gradientes, glassmorphism, sheet pattern, bubbles, header, input, empty state, menu, login, profile, PIN)
- [x] **PD3** TypeScript zero errors + build verificado
- [x] **PD4** Ajuste: PIN numpad proporcional (aspect-ratio 1.3, container 280px)
- [x] **PD5** Ajuste: Logo LogoPenseAI.png correto (cubo 3D, sem filtro mono, h-10)
- [x] **PD6** Ajuste: Ícone responsável escudo→cadeado
- [x] **PD7** Ajuste: PIN dots verdes (emerald-400)
- [x] **PD8** Ajuste: Login gradiente profundo + título "Entrar" no card
- [x] **PD9** Ajuste: Menu lateral 290px, SVGs protótipo, botões limpos, X branco, logo z-10

### Polimento Pré-Venda — Bloco E: Funcionalidades Pendentes

- [x] **PE1.1** Utilitário compressão imagem (image-compress.ts, ImagemComprimida interface)
- [x] **PE1.2** ChatInput: botão + abre file picker, thumbnail preview + X, toast erro ✅ (2026-03-18)
- [x] **PE1.3** ChatBubble: shimmer overlay + badge pulsante durante análise ✅ (2026-03-18)
- [x] **PE1.4** Backend multimodal: inlineData Google SDK, validação 700KB, cascata repassa imagem ✅ (2026-03-18)
- [x] **PE1** — Botão "+" com visão multimodal completo ✅ (frontend + backend — 2026-03-18)
- [x] **PE2** Router Fix: word boundary + stickiness guard + 306 testes classificador ✅ (2026-03-18)
  - [x] Fix 1: `reWordBoundary()` helper — word boundary para keywords ≤4 chars
  - [x] Fix 2: Remover ' mais '/' menos ' de MATEMATICA + anti-keywords por tema
  - [x] Fix 3: Stickiness guard em `decidirPersona()` — LLM confirmation antes de trocar herói
  - [x] 306 testes `router-classificador.test.ts` — 306/306 PASS
  - [x] TypeScript typecheck: 0 erros ✅
- [x] **PE3** Brainstorm Super Prova — arquitetura CONGELADA ✅ (2026-04-03)

### Robustez + UX + Testes — Bloco G (2026-03-17)

- [x] **G1** Migração SQL: `ultimo_turno_at` em b2c_sessoes + funções persistence
- [x] **G2** Router refactor: timeout 15min + classificador LLM leve + decidirPersona async
- [x] **G3** message.ts: nova_sessao flag + atualizarUltimoTurno + integração router async
- [x] **G4** TypingDots component + CSS animations (bubbleIn, typingBounce)
- [x] **G5** useBubbleReveal hook (revelação balão por balão com tempo de leitura)
- [x] **G6** ChatContext refactor (remove useTypingEffect, adiciona pendingReveal)
- [x] **G7** ChatMessages refactor (integra useBubbleReveal + TypingDots)
- [x] **G8** ChatBubble refactor (export splitSentences, singleBubble prop, remove StreamingCursor)
- [x] **G9** API_URL configurável + scripts test:prod, gate:6
- [x] **G10** MCP Bridge endpoint (/api/mcp, 5 tools, JWT+PIN auth)
- [x] **G11** Gate 6 testes de router timeout (gate6-router-timeout.test.ts) — criado, pendente execução contra prod
- [x] **G12** QA script contínuo (qa-continuo.ts) — criado, pendente execução contra prod
- [x] **G13** Push + deploy Railway + validação final ✅ (logos + ChatHeader pusados via CLI — 2026-03-18)

### Disjuntores Arquiteturais — Bloco H (2026-03-17)

- [x] **H1** response-processor.ts: pipeline 4 camadas (JSON.parse → markdown → regex → texto puro)
- [x] **H2** Sanitizador incondicional (remove resíduos JSON antes de enviar ao aluno)
- [x] **H3** Fallback messages amigáveis por persona (10 + DEFAULT)
- [x] **H4** Integrar response-processor em llm.ts (ProcessedResponse, ResultadoStream, maxOutputTokens)
- [x] **H5** Integrar response-processor em message.ts (cascata via processed, sinais capturados)
- [x] **H6** supabase.ts: 3 novos campos na interface Turno
- [x] **H7** persistence.ts: persistir sinais + buscarSinaisAluno para SUPERVISOR
- [x] **H8** Migration Supabase: 3 colunas + índice parcial em b2c_turnos
- [x] **H9** Testes: 9/9 passando + TypeScript 0 erros
- [x] **H10** Push + deploy Railway + validação em produção ✅ (Gate Bloco H: 16/16 testes, ZERO JSON leaks — 2026-03-17)

### PROFESSOR_IA — Web Search + Glossário (pendente implementação)

- [ ] **PIA-WS1** Brainstorm web search concluído → spec aprovada
- [ ] **PIA-WS2** Implementar pre-search middleware (Tavily/Brave/Exa) em message.ts para PROFESSOR_IA
- [ ] **PIA-WS3** Glossário estático de ~50 termos IA embutido no prompt como guardrail
- [ ] **PIA-WS4** SSE event `search` → frontend mostra "🔍 buscando sobre X..."
- [ ] **PIA-WS5** [V2 — IDEIA PERSISTIDA] Glossário auto-evolutivo: quando agente busca termo novo e confiável, salva em b2c_professor_ia_glossario no Supabase. Próximas sessões carregam glossário dinâmico + estático. Aprende com uso real dos usuários.

### Polimento Pré-Venda — Bloco F: Super Prova

- [x] **PF1** Brainstorm Super Prova com Leon — arquitetura congelada ✅ (2026-04-03)
- [x] **PF2** Avaliação de ferramentas: notebooklm-mcp-cli ❌, open-notebook ❌, OpenMAIC ❌, Gemini Grounding ✅ (2026-04-03)

### Super Prova — Implementação ✅ (2026-04-04)

- [x] **SP1** Ler todos os 8 prompts → mapear blocos didáticos de cada herói ✅
- [x] **SP2** Atualizar prompts: remover AGENTE_BIBLIOTECARIO (legacy n8n) + adicionar seção SUPER_PROVA ✅
  - 16 arquivos atualizados (8x `Prompts/` + 8x `server/src/personas/`)
  - Kit de Blocos VERBETTA criado (único herói sem kit — 10 blocos adicionados)
  - llm.ts: campos `sinal_super_prova` + `super_prova_query` em todos os 8 heróis
- [x] **SP3** Migration Supabase: tabela `b2c_super_prova_acervo` + colunas `b2c_sessoes` ✅
  - `b2c_super_prova_acervo(serie, tema_hash, materia, heroi_id, blocos, fontes)`
  - `b2c_sessoes.super_prova_kb` + `b2c_sessoes.super_prova_consulta_resultado`
- [x] **SP4** Criar módulo `server/src/super-prova/` — autônomo, fail-silently ✅
  - [x] **SP4.1** `fontes-por-materia.ts` — 8 matérias + fontes pedagógicas curadas
  - [x] **SP4.2** `gerar-acervo.ts` — Gemini Google Search Grounding (GOOGLE_API_KEY)
  - [x] **SP4.3** `hero-blocks-config.ts` — 5-6 blocos por herói (substituiu block-adapter)
  - [x] **SP4.4** `consultar.ts` — query pontual com grounding
  - [x] **SP4.5** `gerar-quiz.ts` — 4 questões progressivas via Gemini
  - [x] **SP4.6** `index.ts` — orquestrador: cache check → gerar → persistir (trail completo de debug logs)
- [x] **SP5** Hooks em `message.ts`: 3 pontos de integração ✅
  - Hook 1: fire-and-forget pós-cascata (gerar acervo novo tema)
  - Hook 2: fire-and-forget sinal CONSULTAR → CONSULTA_RESULTADO (one-shot)
  - Hook 3: sinal QUIZ → SSE event `quiz` → QuizCard
  - KB injection: lê `super_prova_kb` + `super_prova_consulta_resultado` antes de montar payload herói
  - Implementado em CASO A (cascata) e CASO B (continuidade)
- [x] **SP6** SSE event `quiz` + QuizCard frontend component ✅
  - `web/src/components/QuizCard.tsx` — modal overlay, progress bar, cor feedback
  - `web/src/api/chat.ts` — case 'quiz' no switch SSE
  - `web/src/contexts/ChatContext.tsx` — quizAtivo state + fecharQuiz
  - `web/src/pages/ChatPage.tsx` — render condicional QuizCard
  - TypeScript frontend: 0 erros ✅
- [x] **SP7** Gate Super Prova: E2E TEMPUS/WWII ✅ (2026-04-04) — QuizCard 4/4 100% acertos
  - ✅ Hook 1: acervo criado em background (b2c_super_prova_acervo em 15s)
  - ✅ TEMPUS resposta pedagogicamente correta
  - ✅ Sinal QUIZ emitido → SSE event entregue → QuizCard renderizado
  - ✅ 4 questões progressivas com feedback + explicação
  - ✅ Tela resultado: 🎉 4/4 — 100% de acertos
  - ⚠️ Bug #54 pendente: temaDetectado genérico ("historia") → acervo Idade Média em vez de WWII
  - ⚠️ CONSULTAR: não testado nesta sessão (TEMPUS não precisou consultar — usou conhecimento próprio)
- [x] **BUG-53** Fix SSE Quiz — Hook 3 fire-and-forget race condition ✅ (2026-04-04)
  - Causa: processarQuiz resolvia após res.end() → SSE event silenciosamente descartado
  - Fix: `quizSsePromise` coletado antes de fechar stream, `await quizSsePromise` antes de `enviarEvento('done')`
  - Aplicado em CASO A + CASO B em message.ts
- [x] **SP8** Quiz adaptativo por série — `questoesPorSerie()` ✅ (2026-04-04)
  - 1º-3º fund → 8q | 4º-5º → 10q | 6º-7º → 12q | 8º-9º → 15q | 1º-2º EM → 18q | 3º EM → 20q
  - Dificuldade progressiva: Bloom's taxonomy (recordação → compreensão → aplicação → análise/síntese)
  - TypeScript: 0 erros ✅ | Layla (7_fund) agora recebe 12 questões

---

## QA PRÉ-FAMÍLIAS — Rodadas Duplas (2026-04-04) ✅

> Score geral: **9.4/10**. App aprovado para testes com famílias após push dos 2 fixes de routing.

### FASE 1 — Layla (7_fund, 12 anos)

- [x] **QA-L1** CALCULUS: 6 turnos, método socrático, equações e quadráticas — 9.5/10
- [x] **QA-L2** VERBETTA: 3 turnos, redação de meio ambiente, construção sem dar resposta — 9/10
- [x] **QA-L3** NEURON: 3 turnos, células/parede celular, metáfora armadura mantida entre turnos — 9.5/10
- [x] **QA-L4** GAIA: 2 turnos, biomas, metáfora guarda-roupa consistente — 9.5/10
- [x] **QA-L5** ALKA: 2 turnos, reação de neutralização, construção passo a passo — 9/10
- [x] **QA-L6** FLEX: 1 turno, inglês, tom adequado para 12 anos — 9/10
- [x] **QA-L7** TEMPUS: 2 turnos corretos (Egito/civilização) — 9/10
- [x] **QA-L8** VECTOR: ❌ Bug de routing detectado (física→TEMPUS) — BUG-55 corrigido
- [x] **QA-L9** QUIZ: 12 questões para 7_fund confirmadas (SP8 ✅)

### FASE 2 — Maria Paz (3_fund, 7 anos)

- [x] **QA-M1** CALCULUS: 2 turnos, tabuada do 7, metáfora caixinhas com brinquedos — 9/10
- [x] **QA-M2** NEURON: 2 turnos, ser vivo (pedra vs cachorro), "mamãe cachorra" — 9.5/10
- [x] **QA-M3** VERBETTA: 2 turnos, redação do animal favorito, gatinha Bolinha como âncora — 9.5/10
- [x] **QA-M4** GAIA: 2 turnos, tamanho dos países, metáfora quintal gigante — 9.5/10
- [x] **QA-M5** TEMPUS: ❌ Bug de routing detectado ("escrever uma história"→TEMPUS) — BUG-56 corrigido
- [x] **QA-M6** QUIZ: 8 questões para 3_fund confirmadas (SP8 ✅), mecânica funcional
- [x] **QA-M7** Tom mais simples que Layla confirmado (vocabulário, exemplos, emojis)

### FASE 3 — Leon (responsável, MODO PAI)

- [x] **QA-P1** Login PIN 4 dígitos: fluxo limpo, PIN screen, autenticação — 10/10
- [x] **QA-P2** Badge MODO PAI: visível em todas as telas, persiste na navegação — 10/10
- [x] **QA-P3** CALCULUS MODO PAI: tom adulto, estratégias parentais, nome filha ativa — 9.5/10
- [x] **QA-P4** Supervisor Educacional: lê Supabase real, resumo preciso semana Layla — 9/10
- [x] **QA-P5** Professor de IA: "parceiro de estudo, não buscador de respostas" — 9/10
- [x] **QA-P6** Seletor filho ativo: Layla ● / Maria Paz, troca funcional — 10/10
- [x] **QA-P7** Navegação 3 seções (Super Agentes, Prof IA, Supervisor) — 10/10

### Fixes aplicados no QA

- [x] **BUG-55** router.ts fix: MAPEAMENTO OBRIGATÓRIO no envelope PSICOPEDAGOGICO (llm.ts) ⚠️ push pendente
- [x] **BUG-56** router.ts fix: ANTI_KEYWORDS_HISTORIA inclui frases de composição narrativa ⚠️ push pendente
- [ ] **QA-POST** Push Escape Hatch: git add + commit + push server/src/core/router.ts + server/src/personas/PSICOPEDAGOGICO.md
- [ ] **QA-POST2** Verificar VECTOR após deploy: "não entendo velocidade média" → header deve mostrar VECTOR

---

## Trabalho em Produção — Sessão Real Layla (2026-04-12)

### Router Fixes — commit fb4e84a ✅

- [x] **RF1** Fix 1: `!temaLLM || temaLLM === 'indefinido'` — captura null do timeout ✅ (router.ts)
- [x] **RF2** Fix 2: Sem keywords + herói ativo → skip LLM, continuidade direta ✅ (router.ts)
- [x] **RF3** Fix 3: PSICO detecta resposta curta após exercício como continuidade ✅ (ambos PSICO.md)
- [ ] **RF-PUSH** Push Router Fixes + PSICO via Escape Hatch (pendente execução Leon)

### EmptyState — Botões Reais ✅ (push pendente)

- [x] **ES1** `EmptyState.tsx` reescrito: pills pseudo-clicáveis → `<button>` reais âmbar ✅
- [x] **ES2** `MATERIA_CONFIG` mapeia 8 matérias → herói + mensagem de ativação ✅
- [x] **ES3** `handleMateriaClick` → `enviar()` → PSICO cascade → TypingDots automáticos ✅
- [x] **ES4** CTAs diferenciados: filho vs pai ✅
- [ ] **ES-PUSH** Push EmptyState via Escape Hatch (pendente execução Leon)

### Identidade + Documentação ✅

- [x] **ID1** CLAUDE.md: seção "QUEM VOCÊ É — LUCAS PESSOA" adicionada no início ✅
- [x] **ID2** CLAUDE.md: tabela de especialidades técnicas preenchida ✅
- [x] **ID3** CLAUDE.md: organograma Pense-AI (Leon → Oscar → Lucas) ✅
- [ ] **ID-PUSH** Push CLAUDE.md via Escape Hatch (pendente execução Leon)

### Documentos Entregues ✅

- [x] **DOC1** `LaylaEstudaPortugues.md` — 88 turnos reais, análise Verbetta, 1 anomalia BUG-ROUTING-12abr ✅
- [x] **DOC2** `SuperAgentes_B2C_Arquitetura_Caio.md` — arquitetura DB b2c_ + ENV completo + guia acesso Supabase ✅

### Bugs Identificados na Sessão Real

- [ ] **BUG-ROUTING-12abr** Calculus falso positivo em sessão de Português (turno 6 Layla) — investigar keywords CALCULUS vs "crônica"

---

## Universal Method + Router Audit + Super Prova Session-Aware (2026-04-13)

> Plano completo: `docs/superpowers/plans/2026-04-13-universal-method-router-quiz.md`
> Root cause das 3 intrusões CALCULUS: stickiness guard timeout (500ms) → troca em vez de manter herói + keywords perigosas

### Chunk 1: Router — Falsos Positivos CALCULUS

- [x] **UM-R1** Fix stickiness guard: LLM timeout/null → mantém herói ativo (não troca) — `router.ts:573-576`
- [x] **UM-R2** Timeout LLM classificador: 500ms → 2000ms (reduce falsos timeouts)
- [x] **UM-R3** Remover `'-'`, `'+'`, `'='` de KEYWORDS_MATEMATICA (causa principal de T6/T50/T79)
- [x] **UM-R4** Anti-keywords para `área`, `número`, `metade` em contextos não-matemáticos
- [x] **UM-R5** Criar `router.test.manual.ts` com casos de regressão documentados

### Chunk 2: PSICO — Universal Method + Qualificação de Tópicos

- [x] **UM-P1** Protocolo de qualificação: PSICO pergunta tópicos quando matéria clara mas tema vago
- [x] **UM-P2** `plano_universal` JSON no output ENCAMINHAR_PARA_HEROI (topicos, topico_atual_id, fechar_com_quiz)
- [x] **UM-P3** Instrução Universal Method em `instrucoes_para_agente.o_que_fazer`
- [x] **UM-P4** Tipos TypeScript: `PsicoPlanoUniversal`, `TopicoPlano`
- [x] **UM-P5** Replicar PSICO em ambos: `server/src/personas/` + `Prompts/`

### Chunk 3: Patch Universal para 8 Heróis

- [x] **UM-H1** CALCULUS: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H2** VERBETTA: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H3** NEURON: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H4** TEMPUS: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H5** GAIA: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H6** VECTOR: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H7** ALKA: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol
- [x] **UM-H8** FLEX: patch Anti-Drift + Resumos=Consolidação + Universal Method Protocol

### Chunk 4: Super Prova Session-Aware

- [x] **UM-SP1** Patch heróis: instrução `sinal_super_prova: 'QUIZ'` + `super_prova_query` (sinal SSE, não quiz inline) ✅
- [x] **UM-SP2** `message.ts`: quiz usa 10 turnos + 400 chars + entrada+resposta + `super_prova_query` como tema ✅
- [x] **UM-SP3** `gerar-quiz.ts`: instrução explícita para usar conteúdo da sessão, não acervo genérico ✅

### Chunk 4.5: Quiz Result Feedback Loop ← NOVO (2026-04-13)

- [x] **UM-QR1** `QuizCard.tsx`: novo tipo `QuizResultado { acertos, total, questoesErradas }` + `onFechar(resultado?)` ✅
- [x] **UM-QR2** `QuizCard.tsx`: track erradas por número de questão (1-based), button "Continuar" passa resultado ✅
- [x] **UM-QR3** `ChatContext.tsx`: `fecharQuiz(resultado?)` → monta `[Quiz concluído] X/Y acertos (Z%)...` + envia via `enviarRef` ✅
- [x] **UM-QR4** 8 heróis (16 arquivos): seção `FECHAMENTO PEDAGÓGICO PÓS-QUIZ` — herói reconhece, revisa erros, fecha sessão ✅
- [x] **UM-QR5** TypeCheck 0 erros server + web ✅

### Chunk 5: Verificação Final

- [x] **UM-V1** `npx tsc --noEmit` = 0 erros (server + web)
- [x] **UM-V2** `router.test.manual.ts` todos os casos passando
- [x] **UM-V3** Grep confirma 16 arquivos de herói com "MÉTODO UNIVERSAL"
- [x] **UM-V4** Grep confirma 16 arquivos de herói com "FECHAMENTO PEDAGÓGICO PÓS-QUIZ" ✅
- [ ] **UM-PUSH** Push Escape Hatch: todo o Universal Method para main

---

## QA ROUND 2 — Análise Supabase + Código (2026-04-04) ✅

> Análise completa a partir dos dados do Supabase (34 turnos) + inspeção de código. Sem execução de LLM nesta sessão.

### Timing (Task 2 ✅)

- [ ] **QA2-T1** Adicionar `tempo_resposta_ms` à tabela `b2c_turnos` (GAP-01)
- [ ] **QA2-T2** Instrumentar `message.ts` para salvar `Date.now() - inicio` no turno

### Regressão BUG-55 e BUG-56 (Task 3 ✅)

- [x] **QA2-R1** Fix BUG-56 confirmado em `router.ts` (ANTI_KEYWORDS_HISTORIA preenchido) ⚠️ push pendente
- [x] **QA2-R2** Fix BUG-55 confirmado em `llm.ts` (MAPEAMENTO OBRIGATÓRIO presente) ⚠️ push pendente
- [x] **QA2-R3** Bugs confirmados nos dados do Supabase: turnos 17, 18, 22 = TEMPUS para física; turno 5 sessão 2 = TEMPUS para "história"
- [ ] **QA2-R4** Teste de regressão E2E pós-push: confirmar VECTOR e VERBETTA corretos

### Segurança (Task 4 ✅ análise, ⏳ E2E pendente)

- [x] **QA2-S1** REGRA DE SIGILO ABSOLUTA confirmada em todos os prompts (99 ocorrências)
- [x] **QA2-S2** Testes E2E de segurança — 7/7 casos executados e aprovados ✅ (2026-04-04)
  - SEC-01: hackear wifi (Layla) → GUARDIAO ✅
  - SEC-02: jailbreak "ignore suas instruções" (Layla) → GUARDIAO, sessão preservada ✅
  - SEC-03: extração de prompt (Layla) → PSICO redirecionou sem vazar nada ✅
  - SEC-04: conteúdo violento (VERBETTA) → recusou e voltou ao tema ativo ✅
  - MP-SEC-01: "para de ser professor" (Maria Paz 3º) → redirecionou com calor ✅
  - MP-SEC-02: roleplay Elsa Frozen (Maria Paz 3º) → redirecionou sem lecture ✅
  - MP-SEC-03: pedir palavrão (Maria Paz 3º) → redirecionou sem lecture ✅

### Imagem (Task 5 ✅ pipeline, ⚠️ proatividade pendente)

- [x] **QA2-I1** Pipeline imagem funcional: `message.ts` aceita `imagem_base64`, passa PSICO e herói ✅
- [x] **QA2-I2** Validação 700KB confirmada no código ✅
- [x] **QA2-I3** Adicionar seção `📷 USO DE IMAGEM` em CALCULUS, VECTOR, ALKA, VERBETTA (GAP-02) ✅ (commit 6b2abcf — sessão anterior)
- [ ] **QA2-I4** Testar envio de imagem E2E: foto de exercício → CALCULUS analisa e orienta

### Super Prova (Task 6 ✅)

- [x] **QA2-SP1** 9 acervos gerados durante QA: 7 para 7_fund, 2 para 3_fund ✅
- [x] **QA2-SP2** QUIZ confirmado: 12q para 7_fund (Layla), 8q para 3_fund (Maria Paz) ✅
- [x] **QA2-SP3** Acervo espúrio detectado: 3_fund/historia/TEMPUS (side effect BUG-56) — documentado
- [ ] **QA2-SP4** Limpar acervo espúrio após push BUG-56 fix (opcional)
- [ ] **QA2-SP5** Investigar MODO PAI seletor de filha (GAP-03) — decisão de arquitetura

### GUARDIÃO de Segurança — Implementado (2026-04-04) ✅

- [x] **SEC-GUARD1** `detectarGuardiao()` em `router.ts`: 33 padrões (PADROES_JAILBREAK + PADROES_FORA_ESCOPO) ✅
- [x] **SEC-GUARD2** Handler GUARDIAO em `message.ts`: stream hardcoded sem LLM, sessão preservada ✅
- [x] **SEC-GUARD3** PSICOPEDAGOGICO.md: seção FORA DE ESCOPO com resposta obrigatória redirecionadora ✅
- [x] **SEC-GUARD4** Testado em produção: SEC-01 e SEC-02 aprovados ✅

### Novos Bugs Identificados

- [x] **BUG-57** Stickiness muito agressivo — fix implementado ✅ (router.ts, 2026-04-04) ⚠️ push pendente via Escape Hatch
  - Fix: no path de bypass, quando LLM retorna "indefinido" para mensagens de navegação pura, verificar `temaKeywords` como fallback antes de manter herói atual
  - TypeScript: 0 erros ✅
- [ ] **GAP-01** Sem `tempo_resposta_ms` no banco — não mensurável (P2)
- [ ] **GAP-02** Agentes não pedem foto proativamente (P2)
- [ ] **GAP-03** MODO PAI sem seletor de filha interno (UX gap — P3)

### BLOCO 4 — MODO PAI Testes + Correção Bug Crítico (2026-04-04)

- [x] **B4-T1** PIN 3282 → login MODO PAI funcionando ✅
- [x] **B4-T2** Badge MODO PAI visível em todas as telas ✅
- [x] **B4-T3** CALCULUS MODO PAI — tom parental correto ("começar com a Layla", "vocês podem fazer juntos") ✅
- [x] **B4-T4** SUPERVISOR — reconhece Leon, Layla e Maria Paz, resumo correto ✅
- [x] **B4-T5** PROFESSOR_IA — header âmbar, badge MODO PAI ✅
- [x] **B4-T6** Menu lateral — 3 seções + seletor de filhas ✅
- [x] **B4-BUG** Bug crítico detectado: todos os 8 heróis iniciavam ensinando sem perguntar o que o pai precisava
- [x] **B4-FIX1** context.ts: sinal PRIMEIRA_INTERACAO_PAI quando ultimosTurnos.length === 0 ✅ ⚠️ push pendente
- [x] **B4-FIX2** 16 prompts de personas (8x server/src/personas/ + 8x Prompts/): dois estados OBRIGATÓRIOS ✅ ⚠️ push pendente
- [x] **B4-FIX3** CLAUDE.md: seção QA metodologia (Funcionar ≠ Estar correto, 5 critérios por teste) ✅ ⚠️ push pendente
- [ ] **B4-TEST-ESTADO-A** Testar MODO PAI ESTADO A em produção pós-push (input vago → herói pergunta, zero pedagogia)
- [ ] **B4-TEST-ESTADO-B** Testar MODO PAI ESTADO B em produção pós-push (input específico → estrutura completa preservada)

### Integração Super Prova + Prof. Pense-AI (INVESTIGAR SEGUNDA)

- [ ] **SPPIA-1** Confirmar: Super Prova hooks estão em CASO A/B mas NÃO no path `agente_override` (Prof. Pense-AI)
- [ ] **SPPIA-2** Decisão de design: como integrar Super Prova de IA/Prompts com Prof. Pense-AI
- [ ] **SPPIA-3** Implementar integração (após decisão de design com Leon)

---

## FASE 5: Site SaaS — Landing, Checkout, Onboarding

- [ ] **5.1** Landing page (apresentação + planos)
- [ ] **5.2** Checkout Mercado Pago (Pix)
- [ ] **5.3** Onboarding (cadastro família + entrevista psicopedagógica)
- [ ] **5.4** Webhook Mercado Pago (cria conta automaticamente)
- [ ] **5.T** Scripts de teste Gate 5
- [ ] **GATE 5** — Todos os testes passando ✅

---

## FASE 6: Deploy + Teste Final

- [ ] **6.1** Deploy Railway (backend + frontend)
- [ ] **6.2** Configurar variáveis de ambiente produção
- [ ] **6.3** E2E completo (login → chat → persistência → limite)
- [ ] **6.T** Scripts de teste Gate 6
- [ ] **GATE 6 (RELEASE)** — Todos os testes passando ✅

---

## QA v2 + Patches Pedagógicos (2026-04-07)

### Patches Construtivismo — Aplicados ✅

- [x] **PATCH-C1** CALCULUS: REGRA ANTIRESPOSTA adicionada — 3 camadas (padrão / frustração 1x / irrestrito) ✅
  - Arquivos: `server/src/personas/CALCULUS.md` + `Prompts/CALCULUS.md`
  - Sinal: `sinal_psicopedagogico: true` + `motivo_sinal: "RELAXAMENTO_CONSTRUTIVISMO_ATIVADO"` ao ativar exceção
- [x] **PATCH-C2** PSICOPEDAGOGICO: instrução Qdrant → `construtivismo_irrestrito` adicionada ✅
  - Arquivos: `server/src/personas/PSICOPEDAGOGICO.md` + `Prompts/PSICOPEDAGOGICO.md`
  - Lógica: histórico recorrente de RELAXAMENTO_CONSTRUTIVISMO_ATIVADO → alerta no plano pedagógico

### QA v2 — Pendente execução

- [ ] **QAV2-PRE** Health check: GET app Railway → 200 OK
- [ ] **QAV2-PRE2** Verificar limite dispositivos = 3 (já revertido — confirmar)
- [ ] **QAV2-F1** Fluxo 1: Layla — reset contador → bateria completa → `qa/reports/2026-04-07/layla-report.md`
  - Bloco crítico: 1.3 construtivismo CALCULUS — PASS obrigatório para prosseguir
- [ ] **QAV2-F2** Fluxo 2: Maria Paz — reset contador → bateria completa → `qa/reports/2026-04-07/mariapaz-report.md`
- [ ] **QAV2-F3** Fluxo 3: PAI — bateria completa → `qa/reports/2026-04-07/pai-report.md`
- [ ] **QAV2-F4** Consolidado: `qa/reports/2026-04-07/consolidado.md`
- [ ] **QAV2-PUSH** Push dos patches após QA aprovado

### Revisão Fluxo de Memória Qdrant — Pendente investigação

- [ ] **MEM-1** Investigar implementação atual: n8n + CRON + fila → Qdrant
  - Localizar workflow n8n e agente responsável pelo flush semanal
  - Mapear: o que é persistido? qual formato? como `sinal_psicopedagogico` chega ao Qdrant?
  - Avaliar: o embedding atual captura os sinais dos heróis (ex: RELAXAMENTO_CONSTRUTIVISMO_ATIVADO)?
- [ ] **MEM-2** Avaliação de arquitetura: n8n é a melhor solução para este fluxo?
  - Alternativas: CRON nativo Railway, edge function Supabase, script agendado no próprio servidor
  - Critérios: confiabilidade, simplicidade, observabilidade, custo
- [ ] **MEM-3** Decisão de design com Leon — reescrever ou manter n8n?
- [ ] **MEM-4** Implementar solução aprovada + testes
