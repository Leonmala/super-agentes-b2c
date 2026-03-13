# CHECKLIST DO PROJETO — Super Agentes V1.0

> **Regra:** A cada task concluída, marcar [x]. A cada fase concluída com Gate passando, marcar o Gate.
> **Última atualização:** 2026-03-13 (deploy + visual polish)

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
