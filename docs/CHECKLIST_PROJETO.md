# CHECKLIST DO PROJETO — Super Agentes V1.0

> **Regra:** A cada task concluída, marcar [x]. A cada fase concluída com Gate passando, marcar o Gate.
> **Última atualização:** 2026-03-18 (Router Fix + 306 testes classificador — TypeScript 0 erros)

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

## FASE 2.5: Workshop PROFESSOR_IA

- [ ] **2.5.1** Sessão de design colaborativo com Leon
- [ ] **2.5.2** Criar prompt PROFESSOR_IA.md
- [ ] **2.5.3** Integrar no sistema (router, llm, interface)

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
- [ ] **PE3** Brainstorm agente NotebookLM / Super Prova com Leon

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

### Polimento Pré-Venda — Bloco F: Brainstorm Super Prova/Estudo

- [ ] **PF1** Sessão de brainstorm com Leon (MCP + NotebookLM)
- [ ] **PF2** Análise de viabilidade (V1 vs V1.1)

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
