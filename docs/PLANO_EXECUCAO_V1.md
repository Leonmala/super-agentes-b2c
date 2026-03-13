# Super Agentes Educacionais V1.0 — Plano de Execução Final

> **Para agentes de execução:** Use superpowers:subagent-driven-development para implementar este plano. Steps usam checkbox (`- [ ]`) para tracking. **REGRA: cada fase tem um GATE GO/NO-GO. A fase seguinte SÓ inicia se o gate passar.**

**Data:** 12/03/2026 (atualizado 12/03/2026)
**Autor:** Claude Opus (Engenheiro de Software + Gestor de Projeto)
**Base:** PRE_PLANEJAMENTO_V1.md + Verdade_SuperAgentes_hoje_12_03_26.md + código teste6-railway_v2_fast
**Destino:** Novo projeto na raiz de SuperAgentes_B2C_V2/

**Goal:** Construir a V1 completa do Super Agentes — produto SaaS com 8 professores de IA, sistema de login familiar, 3 interfaces (filho fundamental, filho ensino médio, pai), site de venda com Mercado Pago, e memória vetorial com Qdrant.

**Arquitetura:** Monolito TypeScript + Express servindo API REST/SSE e frontend Vite+React. Um único orquestrador GESTOR decide a persona, monta payload, chama LLM e persiste. O frontend é SPA React servido como static pelo mesmo Express em produção. Banco Supabase com tabelas prefixadas `b2c_`. Deploy Railway.

**Tech Stack:** TypeScript strict, Express 4, Vite + React 18, Supabase (PostgreSQL), Google AI (Gemini dev) / Kimi K2.5 (prod), Qdrant, Mercado Pago, Railway.

---

## Estratégia de Execução Multi-Agente

```
┌─────────────────────────────────────────────────┐
│           MODELO DE EXECUÇÃO PARALELA           │
│                                                 │
│  AGENTE PRINCIPAL         SUBAGENTE TESTES      │
│  ─────────────────       ──────────────────     │
│  Codifica Fase N    ──▶  Escreve testes Fase N  │
│  ↓                       ↓                      │
│  Finaliza código         Finaliza scripts       │
│  ↓                       ↓                      │
│  ◀── MERGE ──────────────┘                      │
│  ↓                                              │
│  ✅ RODA TESTES → GATE GO/NO-GO                 │
│  ↓                                              │
│  Se PASS → Inicia Fase N+1                      │
│  Se FAIL → Debug + fix → Roda testes de novo    │
└─────────────────────────────────────────────────┘
```

**Regra:** Enquanto o agente principal finaliza o código da fase, um subagente em paralelo já codifica os scripts de teste automatizados dessa mesma fase. Quando ambos terminam, os testes rodam. Se passam → próxima fase. Se falham → debug até passar.

---

## Índice

1. [Análise do Estado Atual](#1-análise-do-estado-atual)
2. [Estrutura de Arquivos da V1](#2-estrutura-de-arquivos-da-v1)
3. [Schema do Banco de Dados (b2c_)](#3-schema-do-banco-de-dados)
4. [Fase 1: Fundação — Backend + GATE 1](#4-fase-1)
5. [Fase 2: Agentes — 8 Professores + Modos + GATE 2](#5-fase-2)
6. [Fase 2.5: Workshop PROFESSOR_IA](#55-workshop-professor-ia)
7. [Fase 3: Frontend — Vite + React + GATE 3](#6-fase-3)
8. [Fase 4: Infraestrutura — CRON, Qdrant, Limites + GATE 4](#7-fase-4)
9. [Fase 5: Site SaaS — Landing, Checkout, Onboarding + GATE 5](#8-fase-5)
10. [Fase 6: Deploy + Teste Final + GATE 6 (RELEASE)](#9-fase-6)
11. [Riscos e Mitigações](#10-riscos)
12. [Decisões Técnicas](#11-decisões)

---

## 1. Análise do Estado Atual

### Código Existente (teste6-railway_v2_fast/)

| Arquivo | Função | O que aproveitar |
|---------|--------|-----------------|
| `src/index.ts` | Servidor Express + endpoint SSE | Loop principal, fluxo cascata, envio SSE |
| `src/router.ts` | Roteamento por keywords + LLM | Lógica de roteamento, expandir para 8 matérias |
| `src/llm.ts` | Cliente Google AI + envelope GESTOR | Envelope GESTOR inteiro, chamarLLM + chamarLLMStream |
| `src/context.ts` | Montador de contexto | Estrutura completa, adicionar campo tipo_usuario |
| `src/persistence.ts` | CRUD Supabase | Padrão de queries, adaptar para tabelas b2c_ |
| `src/metrics.ts` | Métricas de tempo/tokens | Inteiro, sem alteração |
| `src/supabase.ts` | Cliente + tipos | Adaptar tipos para novo schema |

### Banco Existente (Supabase ahopvaekwejpsxzzrvux)

**Tabelas t6_ (referência — NÃO deletar):**
- `t6_alunos` — id (text), nome, serie, idade, perfil, dificuldades, interesses
- `t6_sessoes` — id (uuid), aluno_id, turno_atual, agente_atual, tema_atual, plano_ativo, historico_resumido, status, instrucoes_pendentes, agente_destino, transicao_pendente
- `t6_turnos` — id (uuid), sessao_id, numero, agente, entrada, resposta, status, plano, observacao

### Os 10 Prompts Existentes + 1 a Criar

| Persona | Matéria | Arquivo | Status |
|---------|---------|---------|--------|
| CALCULUS | Matemática | CALCULUS.md | ✅ Validado produção |
| **VERBETTA** | Português | VERBETTA.md | ✅ Validado produção |
| NEURON | Ciências/Bio | NEURON.md | ✅ Pronto |
| TEMPUS | História | TEMPUS.md | ✅ Pronto |
| GAIA | Geografia | GAIA.md | ✅ Pronto |
| VECTOR | Física | VECTOR.md | ✅ Pronto |
| ALKA | Química | ALKA.md | ✅ Pronto |
| FLEX | Inglês/Espanhol | FLEX.md | ✅ Pronto |
| PSICOPEDAGOGICO | Orquestração | PSICOPEDAGOGICO.md | ✅ Validado |
| SUPERVISOR | Pais | SUPERVISOR_EDUCACIONAL.md | ✅ Pronto |
| **PROFESSOR_IA** | IA Educacional | PROFESSOR_IA.md | ❌ **A criar (Fase 2.5)** |

> **PADRONIZAÇÃO:** O nome correto é **VERBETTA** (dois T). Qualquer referência "VERBETA" no código teste6 deve ser corrigida na V1.

---

## 2. Estrutura de Arquivos da V1

```
SuperAgentes_B2C_V2/
├── server/                          # Backend Express
│   ├── src/
│   │   ├── index.ts                 # Servidor Express, rotas, middleware
│   │   ├── routes/
│   │   │   ├── message.ts           # POST /api/message (SSE)
│   │   │   ├── auth.ts              # POST /api/auth/login, /select-profile
│   │   │   ├── payment.ts           # POST /api/payment/create, /webhook
│   │   │   └── health.ts            # GET /api/health
│   │   ├── core/
│   │   │   ├── router.ts            # Roteamento 8 matérias + classificador LLM
│   │   │   ├── llm.ts               # Cliente LLM + envelope GESTOR (Gemini/Kimi)
│   │   │   ├── context.ts           # Montador de contexto (+ tipo_usuario)
│   │   │   └── metrics.ts           # Métricas tempo/tokens
│   │   ├── db/
│   │   │   ├── supabase.ts          # Cliente Supabase + tipos b2c_
│   │   │   ├── persistence.ts       # CRUD turnos, sessões
│   │   │   ├── auth-queries.ts      # Queries login, família, PIN
│   │   │   └── usage-queries.ts     # Queries limite de uso diário
│   │   ├── services/
│   │   │   ├── cron.ts              # CRON semanal
│   │   │   ├── qdrant.ts            # Cliente Qdrant
│   │   │   └── device-control.ts    # Controle dispositivos simultâneos
│   │   └── personas/                # Prompts .md dos agentes (11 arquivos)
│   ├── tests/                       # ⭐ SCRIPTS DE TESTE AUTOMATIZADOS
│   │   ├── gate1-backend.test.ts    # Testes Gate 1
│   │   ├── gate2-agentes.test.ts    # Testes Gate 2
│   │   ├── gate3-frontend.test.ts   # Testes Gate 3
│   │   ├── gate4-infra.test.ts      # Testes Gate 4
│   │   ├── gate5-site.test.ts       # Testes Gate 5
│   │   ├── gate6-e2e.test.ts        # Testes Gate 6 (release)
│   │   ├── helpers/
│   │   │   ├── api-client.ts        # Helper HTTP para chamar endpoints
│   │   │   ├── seed-data.ts         # Dados de seed para testes
│   │   │   └── assertions.ts        # Assertions customizadas
│   │   └── run-gate.sh              # Script: "npm run gate:1" roda gate específico
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── web/                             # Frontend React (app educacional)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProfileSelectPage.tsx
│   │   │   └── ChatPage.tsx
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── AgentHeader.tsx
│   │   │   ├── SideMenu.tsx
│   │   │   ├── ProfileAvatar.tsx
│   │   │   └── UsageLimitBanner.tsx
│   │   ├── hooks/
│   │   │   ├── useSSE.ts
│   │   │   └── useAuth.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── types/
│   │       └── index.ts
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── site/                            # Site SaaS (landing + checkout + onboarding)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── PlansPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   └── OnboardingPage.tsx
│   │   └── components/
│   │       ├── PlanCard.tsx
│   │       ├── PricingTable.tsx
│   │       ├── OnboardingForm.tsx
│   │       └── PsychoForm.tsx
│   ├── vite.config.ts
│   └── package.json
├── Prompts/                         # Originais (referência)
├── docs/
│   └── PLANO_EXECUCAO_V1.md
└── CLAUDE.md
```

---

## 3. Schema do Banco de Dados (b2c_)

> **Estratégia:** Criar tabelas novas com prefixo `b2c_`. Tabelas `t6_` permanecem intactas como referência/histórico.

```sql
-- ============================================================
-- MIGRATION: Super Agentes B2C V1.0
-- Executar via Supabase SQL Editor ou MCP apply_migration
-- ============================================================

-- FAMÍLIAS
CREATE TABLE b2c_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'base' CHECK (plano IN ('base', 'familiar')),
  max_filhos INT NOT NULL DEFAULT 1,
  max_dispositivos INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  mp_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RESPONSÁVEIS (com PIN)
CREATE TABLE b2c_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ALUNOS
CREATE TABLE b2c_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  serie TEXT NOT NULL,
  idade INT,
  nivel_ensino TEXT NOT NULL DEFAULT 'fundamental' CHECK (nivel_ensino IN ('fundamental', 'medio')),
  perfil TEXT,
  dificuldades TEXT,
  interesses TEXT,
  entrevista_psico JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SESSÕES
CREATE TABLE b2c_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  tipo_usuario TEXT NOT NULL DEFAULT 'filho' CHECK (tipo_usuario IN ('filho', 'pai')),
  responsavel_id UUID REFERENCES b2c_responsaveis(id),
  turno_atual INT NOT NULL DEFAULT 0,
  agente_atual TEXT NOT NULL DEFAULT 'PSICOPEDAGOGICO',
  tema_atual TEXT,
  plano_ativo TEXT,
  historico_resumido TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  instrucoes_pendentes TEXT,
  agente_destino TEXT,
  transicao_pendente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TURNOS
CREATE TABLE b2c_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES b2c_sessoes(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  agente TEXT NOT NULL,
  entrada TEXT NOT NULL,
  resposta TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONTINUIDADE',
  plano TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TURNOS BACKUP (flush semanal)
CREATE TABLE b2c_turnos_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL,
  aluno_id UUID NOT NULL,
  numero INT NOT NULL,
  agente TEXT NOT NULL,
  entrada TEXT NOT NULL,
  resposta TEXT NOT NULL,
  status TEXT,
  plano TEXT,
  semana_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  original_created_at TIMESTAMPTZ
);

-- USO DIÁRIO
CREATE TABLE b2c_uso_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  interacoes INT NOT NULL DEFAULT 0,
  turnos_completos INT NOT NULL DEFAULT 0,
  UNIQUE(aluno_id, data)
);

-- DISPOSITIVOS ATIVOS
CREATE TABLE b2c_dispositivos_ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL,
  tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('filho', 'pai')),
  device_token TEXT NOT NULL,
  ultimo_ping TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QDRANT REFS
CREATE TABLE b2c_qdrant_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  semana_ref TEXT NOT NULL,
  ponto_ids TEXT[],
  resumo_semantico TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_b2c_sessoes_aluno ON b2c_sessoes(aluno_id, status);
CREATE INDEX idx_b2c_turnos_sessao ON b2c_turnos(sessao_id, numero);
CREATE INDEX idx_b2c_uso_diario ON b2c_uso_diario(aluno_id, data);
CREATE INDEX idx_b2c_dispositivos ON b2c_dispositivos_ativos(familia_id);
CREATE INDEX idx_b2c_alunos_familia ON b2c_alunos(familia_id);
```

---

## 4. Fase 1: Fundação — Backend

**Duração estimada:** 3-4 dias
**Dependências:** Nenhuma

### Execução Paralela Fase 1

```
AGENTE PRINCIPAL (Tasks 1.1-1.6)    SUBAGENTE TESTES (Task 1.T)
────────────────────────────────    ────────────────────────────
Scaffold server                     Escreve gate1-backend.test.ts
Migrar banco b2c_                   Escreve helpers/api-client.ts
Migrar core                         Escreve helpers/seed-data.ts
Implementar auth
Implementar /api/message
Copiar personas
        ↓                                    ↓
        └────────── MERGE ──────────────────┘
                     ↓
              ✅ RODAR GATE 1
```

### Task 1.1: Scaffold do projeto server

**Files:** `server/package.json`, `server/tsconfig.json`, `server/.env.example`, `server/src/index.ts`

- [ ] **Step 1:** Criar package.json com dependências: express, @supabase/supabase-js, @google/generative-ai, bcryptjs, cors, dotenv, jsonwebtoken, node-cron
- [ ] **Step 2:** Criar tsconfig.json (strict: true, ESNext, bundler moduleResolution)
- [ ] **Step 3:** Criar .env.example (SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_API_KEY, GEMINI_MODEL, LLM_PROVIDER, JWT_SECRET, QDRANT_URL, QDRANT_API_KEY, PORT)
- [ ] **Step 4:** Criar index.ts mínimo (Express + /api/health)
- [ ] **Step 5:** npm install + verificar que roda
- [ ] **Step 6:** Commit

### Task 1.2: Camada de banco b2c_

**Files:** `server/src/db/supabase.ts`, `server/src/db/persistence.ts`, `server/src/db/auth-queries.ts`, `server/src/db/usage-queries.ts`

- [ ] **Step 1:** Aplicar migration SQL (seção 3) no Supabase
- [ ] **Step 2:** Criar supabase.ts — cliente + interfaces TypeScript (Familia, Responsavel, Aluno, Sessao, Turno, UsoDiario, DispositivoAtivo)
- [ ] **Step 3:** Criar persistence.ts — migrar de teste6, trocar t6_ por b2c_ em todas as queries. API: `buscarAluno()`, `buscarOuCriarSessao(alunoId, tipoUsuario)`, `buscarUltimosTurnos()`, `persistirTurno()`, `atualizarSessao()`
- [ ] **Step 4:** Criar auth-queries.ts — `buscarFamiliaPorEmail()`, `validarSenhaFamilia()`, `buscarFilhosDaFamilia()`, `buscarResponsavel()`, `validarPinResponsavel()`, `criarFamilia()`, `criarResponsavel()`, `criarAluno()`
- [ ] **Step 5:** Criar usage-queries.ts — `incrementarUso()`, `buscarUsoDiario()`, `verificarLimiteAtingido()` (25 interações OU 5 turnos → retorna `{ atingido: true }`)
- [ ] **Step 6:** Commit

### Task 1.3: Core (router, LLM, context, metrics)

**Files:** `server/src/core/router.ts`, `server/src/core/llm.ts`, `server/src/core/context.ts`, `server/src/core/metrics.ts`

- [ ] **Step 1:** Criar router.ts expandido — keywords para 8 matérias + espanhol (9 categorias → 8 personas, FLEX cobre inglês E espanhol). Classificador LLM com todas as categorias. `personaPorTema()` retorna persona correta.
- [ ] **Step 2:** Criar llm.ts — migrar envelope GESTOR intacto. Adicionar `instrucaoFormatoPorPersona` para NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX (seguindo padrão CALCULUS/VERBETTA). Preparar interface `LLMProvider` para Gemini/Kimi.
- [ ] **Step 3:** Criar context.ts — adicionar MODO PAI/FILHO no contexto montado. Se modo pai: incluir instrução "Você está atendendo o RESPONSÁVEL".
- [ ] **Step 4:** Copiar metrics.ts sem alteração.
- [ ] **Step 5:** Commit

### Task 1.4: Rotas de autenticação

**Files:** `server/src/routes/auth.ts`, modificar `server/src/index.ts`

- [ ] **Step 1:** POST /api/auth/login — valida email+senha → retorna JWT (familia_id) + dados família + filhos + responsável
- [ ] **Step 2:** POST /api/auth/select-profile — se pai, valida PIN. Determina tipo_interface: fundamental | medio | pai (baseado em aluno.nivel_ensino)
- [ ] **Step 3:** Registrar rotas no index.ts
- [ ] **Step 4:** Commit

### Task 1.5: Endpoint /api/message (SSE)

**Files:** `server/src/routes/message.ts`, modificar `server/src/index.ts`

- [ ] **Step 1:** Migrar endpoint SSE do teste6. Mudanças: extrair JWT, validar aluno pertence à família, verificar limite de uso ANTES de processar, adicionar tipo_usuario na sessão.
- [ ] **Step 2:** Expandir heróis válidos:
```typescript
const HEROIS_VALIDOS = ['CALCULUS', 'VERBETTA', 'NEURON', 'TEMPUS', 'GAIA', 'VECTOR', 'ALKA', 'FLEX']
```
- [ ] **Step 3:** Suportar `agente_override` no body (para SUPERVISOR e PROFESSOR_IA)
- [ ] **Step 4:** Incrementar uso diário após resposta bem-sucedida
- [ ] **Step 5:** Quando limite atingido: retornar SSE com mensagem amigável e flag `limite_atingido: true`
- [ ] **Step 6:** Registrar no index.ts + commit

### Task 1.6: Copiar e organizar personas

**Files:** `server/src/personas/` (10 arquivos .md)

- [ ] **Step 1:** Copiar todos os prompts de Prompts/ para server/src/personas/ (10 arquivos, VERBETTA com dois T)
- [ ] **Step 2:** Commit

---

### Task 1.T: Testes Gate 1 (SUBAGENTE — em paralelo)

**Files:** `server/tests/gate1-backend.test.ts`, `server/tests/helpers/api-client.ts`, `server/tests/helpers/seed-data.ts`

- [ ] **Step 1:** Criar helpers/api-client.ts — wrapper HTTP para facilitar chamadas aos endpoints

```typescript
// Exemplo de API client
export class TestClient {
  private baseUrl: string
  private token: string | null = null

  async login(email: string, senha: string): Promise<LoginResponse>
  async selectProfile(perfilId: string, tipo: 'filho' | 'pai', pin?: string): Promise<SelectResponse>
  async sendMessage(alunoId: string, mensagem: string): Promise<ReadableStream> // SSE
  async health(): Promise<{ status: string }>
}
```

- [ ] **Step 2:** Criar helpers/seed-data.ts — cria família de teste + responsável + aluno no Supabase

```typescript
export async function seedTestFamily(): Promise<{
  familia: Familia
  responsavel: Responsavel
  aluno: Aluno
}>
export async function cleanupTestData(familiaId: string): Promise<void>
```

- [ ] **Step 3:** Criar gate1-backend.test.ts com os seguintes testes:

```typescript
// === GATE 1: FUNDAÇÃO BACKEND ===

// 1. HEALTH CHECK
test('GET /api/health retorna 200 + status ok')

// 2. BANCO
test('Tabelas b2c_ existem no Supabase')
test('Seed cria família + responsável + aluno com sucesso')
test('Buscar aluno por ID retorna dados corretos')

// 3. AUTH
test('POST /api/auth/login com credenciais válidas retorna JWT + dados')
test('POST /api/auth/login com senha errada retorna 401')
test('POST /api/auth/select-profile tipo=filho retorna sessão')
test('POST /api/auth/select-profile tipo=pai com PIN correto retorna sessão')
test('POST /api/auth/select-profile tipo=pai com PIN errado retorna 403')
test('Tipo interface = fundamental para aluno série 3º ano')
test('Tipo interface = medio para aluno série 2º EM')

// 4. MESSAGE (SSE)
test('POST /api/message sem auth retorna 401')
test('POST /api/message com mensagem "olá" retorna SSE stream válido')
test('SSE stream contém event:agente com persona válida')
test('SSE stream contém event:chunk com texto')
test('SSE stream termina com event:done')
test('Turno é persistido em b2c_turnos após resposta')
test('Sessão é atualizada após turno')

// 5. ROUTER
test('Mensagem "ajuda com frações" → agente CALCULUS')
test('Mensagem "redação" → agente VERBETTA')
test('Mensagem "célula" → agente NEURON')
test('Mensagem "revolução francesa" → agente TEMPUS')
test('Mensagem "biomas" → agente GAIA')
test('Mensagem "velocidade" → agente VECTOR')
test('Mensagem "tabela periódica" → agente ALKA')
test('Mensagem "verb to be" → agente FLEX')

// 6. LIMITE DE USO
test('Após 25 interações, retorna limite_atingido=true')
test('Mensagem amigável é enviada quando limite atinge')

// 7. CASCATA
test('Primeira mensagem nova matéria: PSICOPEDAGOGICO → Herói (cascata)')
test('Segunda mensagem mesma matéria: Herói direto (continuidade)')
```

- [ ] **Step 4:** Configurar npm scripts:

```json
{
  "scripts": {
    "test": "tsx --test tests/**/*.test.ts",
    "gate:1": "tsx --test tests/gate1-backend.test.ts",
    "gate:2": "tsx --test tests/gate2-agentes.test.ts",
    "gate:all": "tsx --test tests/**/*.test.ts"
  }
}
```

- [ ] **Step 5:** Commit testes

---

### 🚦 GATE 1: GO/NO-GO — Fundação Backend

```bash
cd server && npm run gate:1
```

**Critérios de passagem (TODOS obrigatórios):**

| # | Teste | Resultado esperado |
|---|-------|-------------------|
| 1 | Health check | ✅ 200 + status ok |
| 2 | Tabelas b2c_ existem | ✅ Todas as 8 tabelas criadas |
| 3 | Login funcional | ✅ JWT retornado com dados corretos |
| 4 | PIN do pai funcional | ✅ Validação correta |
| 5 | SSE stream funcional | ✅ Eventos agente/chunk/done recebidos |
| 6 | Router 8 matérias | ✅ 8/8 matérias roteiam para persona correta |
| 7 | Persistência | ✅ Turnos salvos em b2c_turnos |
| 8 | Limite suave | ✅ Bloqueio amigável após 25 interações |
| 9 | Cascata PSICO→Herói | ✅ Primeiro turno passa pelo PSICOPEDAGOGICO |

**Se FAIL:** Debug + fix + rodar testes de novo. NÃO avançar para Fase 2.

**Se PASS:** ✅ Avançar para Fase 2.

---

## 5. Fase 2: Agentes — 8 Professores + Modos

**Duração estimada:** 3-4 dias
**Dependências:** Gate 1 passou ✅

### Execução Paralela Fase 2

```
AGENTE PRINCIPAL (Tasks 2.1-2.3)    SUBAGENTE TESTES (Task 2.T)
────────────────────────────────    ────────────────────────────
MODO PAI em 8+1 personas            Escreve gate2-agentes.test.ts
SUPERVISOR para pais                 (8 heróis × 3 turnos cada)
instrucaoFormato expandida           (MODO PAI × 3 sample)
        ↓                                    ↓
        └────────── MERGE ──────────────────┘
                     ↓
              ✅ RODAR GATE 2
```

### Task 2.1: Adicionar MODO PAI nos 8 heróis + PSICO

**Files:** Modify `server/src/personas/*.md` (9 arquivos)

- [ ] **Step 1:** Para cada herói, ADICIONAR seção MODO PAI no final do prompt (não reescrever). Bloco padrão adaptado por matéria:

```markdown
═══════════════════════════════════════════════════════════════
## MODO PAI (QUANDO O RESPONSÁVEL ESTÁ INTERAGINDO)

Quando o campo MODO no contexto indicar "PAI", você NÃO está falando com o aluno.
Você está falando com o PAI/MÃE/RESPONSÁVEL.

REGRAS:
1. Linguagem adulta, respeitosa
2. Explique COMO ensinar o conteúdo ao filho
3. Dicas práticas de didática parental
4. Sugira atividades pai+filho juntos
5. Use nome do filho quando disponível
6. SEM linguagem infantil ou gamificação
═══════════════════════════════════════════════════════════════
```

- [ ] **Step 2:** Adicionar MODO PAI no PSICOPEDAGOGICO.md (quando pai: orientação parental)
- [ ] **Step 3:** Commit

### Task 2.2: Integrar SUPERVISOR para pais

**Files:** Modify `server/src/core/router.ts`, `server/src/routes/message.ts`

- [ ] **Step 1:** Quando `agente_override === 'SUPERVISOR'` e `tipo_usuario === 'pai'`: usar SUPERVISOR sem passar pelo PSICO
- [ ] **Step 2:** Primeira mensagem do SUPERVISOR = montar resumo automático com dados do filho (últimos turnos + uso)
- [ ] **Step 3:** Commit

### Task 2.3: Expandir instrucaoFormatoPorPersona

**Files:** Modify `server/src/core/llm.ts`

- [ ] **Step 1:** Adicionar instrução de formato JSON para NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX (mesmo padrão CALCULUS/VERBETTA com agent_id e tema corretos)
- [ ] **Step 2:** Expandir few-shot do PSICO para incluir exemplos de encaminhamento para novos heróis
- [ ] **Step 3:** Commit

---

### Task 2.T: Testes Gate 2 (SUBAGENTE — em paralelo)

**Files:** `server/tests/gate2-agentes.test.ts`

- [ ] **Step 1:** Criar testes — 8 heróis × 3 turnos cada (24 testes automatizados):

```typescript
// === GATE 2: AGENTES ===

const HEROIS_MATERIAS = [
  { heroi: 'CALCULUS', materia: 'matematica', perguntas: ['ajuda com frações', 'não entendi', 'e decimais?'] },
  { heroi: 'VERBETTA', materia: 'portugues', perguntas: ['quando usar crase', 'me dá exemplo', 'e na frase "fui à escola"?'] },
  { heroi: 'NEURON', materia: 'ciencias', perguntas: ['como funciona a célula', 'qual parte faz energia', 'e mitocôndria?'] },
  { heroi: 'TEMPUS', materia: 'historia', perguntas: ['o que foi a revolução francesa', 'quem era Napoleão', 'como terminou?'] },
  { heroi: 'GAIA', materia: 'geografia', perguntas: ['o que é bioma', 'quais biomas do Brasil', 'e a amazônia?'] },
  { heroi: 'VECTOR', materia: 'fisica', perguntas: ['o que é velocidade', 'como calcular', 'me dá um exemplo?'] },
  { heroi: 'ALKA', materia: 'quimica', perguntas: ['o que é tabela periódica', 'como funciona', 'e o hidrogênio?'] },
  { heroi: 'FLEX', materia: 'ingles', perguntas: ['verb to be', 'como usar am is are', 'I am student?'] },
]

for (const { heroi, materia, perguntas } of HEROIS_MATERIAS) {
  // Turno 1: Cascata (PSICO → Herói)
  test(`${heroi}: turno 1 cascata funciona e retorna persona ${heroi}`)
  // Turno 2: Continuidade
  test(`${heroi}: turno 2 continuidade mantém persona ${heroi}`)
  // Turno 3: Aprofundamento
  test(`${heroi}: turno 3 responde com conteúdo relevante`)
}

// MODO PAI (3 amostras)
test('CALCULUS MODO PAI: responde como orientação parental')
test('NEURON MODO PAI: responde como orientação parental')
test('FLEX MODO PAI: responde como orientação parental')

// SUPERVISOR
test('SUPERVISOR: retorna resumo quando pai seleciona')
test('SUPERVISOR: inclui dados de turnos do filho')

// FORMATO JSON
test('Resposta de cada herói é JSON válido com campos obrigatórios')

// PERFORMANCE
test('Cascata completa em <10s')
test('Continuidade em <3s')
```

- [ ] **Step 2:** Commit

---

### 🚦 GATE 2: GO/NO-GO — Agentes

```bash
cd server && npm run gate:2
```

**Critérios de passagem:**

| # | Teste | Resultado |
|---|-------|----------|
| 1 | 8 heróis × 3 turnos | ✅ 24/24 passam |
| 2 | MODO PAI × 3 samples | ✅ 3/3 passam (resposta é orientação parental) |
| 3 | SUPERVISOR resumo | ✅ Retorna dados do filho |
| 4 | JSON válido | ✅ Todos retornam JSON parseável |
| 5 | Cascata <10s | ✅ Performance aceitável |
| 6 | Continuidade <3s | ✅ Performance aceitável |

**Se FAIL → Debug + fix + rodar de novo. Se PASS → Avançar.**

---

## 5.5. Fase 2.5: Workshop PROFESSOR_IA

> **Esta fase é uma PAUSA CRIATIVA.** Antes de criar código, precisamos definir o prompt pedagógico do PROFESSOR_IA com o Leon.

**Duração estimada:** 1 dia (sessão interativa)
**Dependências:** Gate 2 passou ✅

### Task 2.5.1: Sessão de Design do PROFESSOR_IA

**Formato:** Conversa interativa Leon + Claude

- [ ] **Step 1: Definir objetivos pedagógicos**

Perguntas para o Leon:
- Qual é o "Método Pense-AI" exatamente? Quais pilares?
- O PROFESSOR_IA ensina a usar QUAL IA? (ChatGPT? Gemini? IA em geral?)
- Foco em: prompting? pensamento crítico? ética? verificação de fontes? todos?
- O PROFESSOR_IA responde dúvidas de matéria usando IA como ferramenta, ou ensina SOBRE IA?

- [ ] **Step 2: Definir público e tom**

- Ensino médio: linguagem jovem mas madura
- Pais: linguagem adulta, foco em orientar sobre uso seguro de IA
- O PROFESSOR_IA tem MODO PAI?

- [ ] **Step 3: Definir exemplos de interação**

Cenários:
- "Como uso IA para estudar para a prova de história?"
- "A IA me deu uma resposta errada, o que faço?"
- "É errado usar IA para fazer trabalho?"
- Modo pai: "Como posso monitorar o uso de IA do meu filho?"

- [ ] **Step 4: Escrever prompt PROFESSOR_IA.md**

Seguir estrutura dos outros prompts:
- REGRA DE SIGILO
- POSIÇÃO NO FLUXO
- ENTRADA
- KIT DIDÁTICO (ferramentas pedagógicas específicas para ensinar sobre IA)
- SAÍDA (formato)
- MODO PAI

- [ ] **Step 5: Testar 3 turnos com PROFESSOR_IA**

- [ ] **Step 6: Commit prompt**

```bash
git add server/src/personas/PROFESSOR_IA.md
git commit -m "feat: prompt PROFESSOR_IA — ensina IA como ferramenta educacional"
```

---

## 6. Fase 3: Frontend — Vite + React

**Duração estimada:** 5-7 dias
**Dependências:** Gate 2 passou ✅

### Execução Paralela Fase 3

```
AGENTE PRINCIPAL (Tasks 3.1-3.6)    SUBAGENTE TESTES (Task 3.T)
────────────────────────────────    ────────────────────────────
Scaffold Vite+React                  Escreve gate3-frontend.test.ts
AuthContext + Login                   (testes de fluxo + integração)
ChatPage + SSE streaming
Menu lateral + 3 interfaces
Upload de imagem
Polimento visual
        ↓                                    ↓
        └────────── MERGE ──────────────────┘
                     ↓
              ✅ RODAR GATE 3
```

### Task 3.1: Scaffold web (Vite + React + Tailwind)

**Files:** `web/` inteiro

- [ ] **Step 1:** `npm create vite@latest web -- --template react-ts`
- [ ] **Step 2:** Instalar: tailwindcss, @tailwindcss/vite, react-router-dom, lucide-react, react-markdown
- [ ] **Step 3:** Configurar proxy vite.config.ts (`/api` → `http://localhost:3001`)
- [ ] **Step 4:** Commit

### Task 3.2: AuthContext + páginas de login

**Files:** `web/src/contexts/AuthContext.tsx`, `web/src/hooks/useAuth.ts`, `web/src/pages/LoginPage.tsx`, `web/src/pages/ProfileSelectPage.tsx`

- [ ] **Step 1:** AuthContext com estado: familia, perfilAtivo, tipoInterface, token
- [ ] **Step 2:** LoginPage — email + senha + botão "Entrar"
- [ ] **Step 3:** ProfileSelectPage — cards com iniciais do nome (ProfileAvatar) para filhos + botão "Sou o responsável" com campo PIN
- [ ] **Step 4:** Lógica de redirecionamento: login → seleção perfil → chat
- [ ] **Step 5:** Commit

### Task 3.3: ChatPage completa

**Files:** `web/src/pages/ChatPage.tsx`, `web/src/components/ChatWindow.tsx`, `web/src/components/ChatInput.tsx`, `web/src/components/MessageBubble.tsx`, `web/src/components/AgentHeader.tsx`, `web/src/hooks/useSSE.ts`

- [ ] **Step 1:** Hook useSSE — POST fetch com ReadableStream, emite onAgente/onChunk/onDone/onError
- [ ] **Step 2:** MessageBubble — bolha usuário (direita, azul) e agente (esquerda, branco + badge)
- [ ] **Step 3:** ChatInput — campo expansível + botão enviar + botão câmera + indicador "digitando..."
- [ ] **Step 4:** AgentHeader — logo + ícone agente ativo + avatar usuário
- [ ] **Step 5:** ChatWindow — orquestra: AgentHeader + mensagens + ChatInput + auto-scroll
- [ ] **Step 6:** ChatPage — usa ChatWindow + renderiza condicionalmente conforme tipoInterface
- [ ] **Step 7:** Commit

### Task 3.4: Menu lateral + 3 interfaces

**Files:** `web/src/components/SideMenu.tsx`, modify `web/src/pages/ChatPage.tsx`

- [ ] **Step 1:** SideMenu — opções: Super Agentes | Supervisor | Professor de IA. Troca envia agente_override.
- [ ] **Step 2:** Interface fundamental: só ChatWindow, sem extras
- [ ] **Step 3:** Interface ensino médio: ChatWindow + botão flutuante "Professor de IA"
- [ ] **Step 4:** Interface pai: ChatWindow + SideMenu completo + seletor de filho
- [ ] **Step 5:** Commit

### Task 3.5: Upload de imagem

**Files:** Modify `web/src/components/ChatInput.tsx`, `server/src/routes/message.ts`

- [ ] **Step 1:** Frontend: botão câmera → preview → enviar como base64
- [ ] **Step 2:** Backend: receber imagem_base64, enviar para Gemini como multimodal
- [ ] **Step 3:** Commit

### Task 3.6: Polimento visual

- [ ] **Step 1:** Tema: azul (#2563EB), roxo accent (#7C3AED), fundo limpo, Inter font
- [ ] **Step 2:** Animações: fade-in mensagens, typing indicator, transição agente
- [ ] **Step 3:** UsageLimitBanner: "Você estudou bastante hoje! Voltamos amanhã! 🌟"
- [ ] **Step 4:** Responsivo mobile-first
- [ ] **Step 5:** Commit

---

### Task 3.T: Testes Gate 3 (SUBAGENTE — em paralelo)

**Files:** `server/tests/gate3-frontend.test.ts`

> Nota: testes de frontend via API (não browser). Validam fluxo end-to-end pela perspectiva do frontend.

```typescript
// === GATE 3: FRONTEND INTEGRATION ===

// AUTH FLOW
test('Login → seleção perfil filho → chat funciona end-to-end')
test('Login → seleção perfil pai + PIN → chat modo pai funciona')
test('PIN errado → rejeita acesso')

// 3 INTERFACES
test('Aluno fundamental (3º ano) → tipo_interface = fundamental')
test('Aluno médio (2º EM) → tipo_interface = medio')
test('Responsável → tipo_interface = pai')

// SSE STREAMING
test('SSE stream retorna chunks incrementais (não tudo de uma vez)')
test('SSE stream inclui event:agente no início')

// AGENTE OVERRIDE
test('agente_override=SUPERVISOR funciona para pai')
test('agente_override=PROFESSOR_IA funciona para ensino médio')

// UPLOAD IMAGEM
test('Mensagem com imagem_base64 é processada pelo LLM')

// LIMITE
test('Após 25 interações, stream retorna limite_atingido=true com mensagem amigável')

// TROCA DE PERFIL
test('Trocar de filho → nova sessão é criada')
```

---

### 🚦 GATE 3: GO/NO-GO — Frontend

```bash
cd server && npm run gate:3
```

**Critérios de passagem:**

| # | Teste | Resultado |
|---|-------|----------|
| 1 | Auth flow completo | ✅ Login → perfil → chat |
| 2 | 3 interfaces | ✅ Cada tipo retorna interface correta |
| 3 | SSE streaming | ✅ Chunks incrementais |
| 4 | SUPERVISOR via override | ✅ Funciona |
| 5 | Upload imagem | ✅ LLM processa |
| 6 | Limite suave | ✅ Banner amigável |

**VERIFICAÇÃO VISUAL MANUAL (além dos testes automatizados):**
- [ ] Abrir web/ no browser e verificar: login, seleção de perfil, chat, menu lateral, troca de agente
- [ ] Testar mobile (responsive) via DevTools
- [ ] Verificar que streaming aparece letra por letra (não blob)

**Se FAIL → Debug. Se PASS → Avançar.**

---

## 7. Fase 4: Infraestrutura — CRON, Qdrant, Limites

**Duração estimada:** 3-4 dias
**Dependências:** Gate 3 passou ✅

### Execução Paralela Fase 4

```
AGENTE PRINCIPAL (Tasks 4.1-4.3)    SUBAGENTE TESTES (Task 4.T)
────────────────────────────────    ────────────────────────────
CRON semanal                         Escreve gate4-infra.test.ts
Integrar Qdrant
Controle dispositivos
        ↓                                    ↓
        └────────── MERGE ──────────────────┘
                     ↓
              ✅ RODAR GATE 4
```

### Task 4.1: CRON de flush semanal

**Files:** `server/src/services/cron.ts`

- [ ] **Step 1:** node-cron domingo 23h (America/Sao_Paulo):
  1. Buscar todos os turnos da semana (todos alunos)
  2. Para cada aluno: gerar resumo semântico via LLM
  3. Criar embedding e salvar no Qdrant
  4. Copiar turnos para b2c_turnos_backup
  5. Deletar turnos da semana
  6. Resetar sessão (turno_atual = 0)
  7. Log de execução
- [ ] **Step 2:** Commit

### Task 4.2: Integrar Qdrant

**Files:** `server/src/services/qdrant.ts`

- [ ] **Step 1:** Cliente Qdrant via REST API (sem SDK):
  - `salvarEmbedding(alunoId, texto, metadata)` — text-embedding-004 do Gemini
  - `buscarContextoLongoPrazo(alunoId, query, limite)` — busca vetorial
- [ ] **Step 2:** Integrar no SUPERVISOR: buscar contexto longo prazo para montar resumo
- [ ] **Step 3:** Graceful degradation: se Qdrant indisponível, SUPERVISOR funciona só com Supabase
- [ ] **Step 4:** Commit

### Task 4.3: Controle de dispositivos simultâneos

**Files:** `server/src/services/device-control.ts`, modify `server/src/routes/auth.ts`

- [ ] **Step 1:** Na seleção de perfil: gerar device_token, registrar em b2c_dispositivos_ativos, contar ativos da família (último ping < 5 min). Se exceder max_dispositivos → rejeitar.
- [ ] **Step 2:** POST /api/auth/ping — frontend envia a cada 2 min para manter device ativo
- [ ] **Step 3:** Limpeza automática: devices com último ping > 30 min são removidos
- [ ] **Step 4:** Commit

---

### Task 4.T: Testes Gate 4 (SUBAGENTE)

**Files:** `server/tests/gate4-infra.test.ts`

```typescript
// === GATE 4: INFRAESTRUTURA ===

// CRON
test('Flush semanal: turnos são copiados para backup')
test('Flush semanal: turnos originais são deletados após backup')
test('Flush semanal: sessão é resetada (turno_atual = 0)')
test('Flush semanal: resumo semântico é gerado por aluno')

// QDRANT
test('salvarEmbedding grava vetor no Qdrant')
test('buscarContextoLongoPrazo retorna resultados relevantes')
test('Qdrant indisponível → SUPERVISOR funciona com fallback Supabase')

// DISPOSITIVOS
test('1 dispositivo → acesso OK')
test('2 dispositivos (plano base) → acesso OK')
test('3 dispositivos (plano base, max=2) → rejeitado com mensagem')
test('3 dispositivos (plano familiar, max=3) → acesso OK')
test('Ping mantém dispositivo ativo')
test('Device sem ping > 30min → removido automaticamente')

// LIMITE SUAVE
test('Interação 24 → permitida normalmente')
test('Interação 25 → permitida com aviso')
test('Interação 26 → limite_atingido=true + mensagem amigável')
test('Próximo dia → contador resetado')
```

---

### 🚦 GATE 4: GO/NO-GO — Infraestrutura

```bash
cd server && npm run gate:4
```

| # | Teste | Resultado |
|---|-------|----------|
| 1 | Flush semanal backup+delete | ✅ |
| 2 | Qdrant save+search | ✅ |
| 3 | Qdrant fallback | ✅ |
| 4 | Dispositivos simultâneos | ✅ |
| 5 | Limite suave com reset diário | ✅ |

**Se FAIL → Debug. Se PASS → Avançar.**

---

## 8. Fase 5: Site SaaS — Landing, Checkout, Onboarding

**Duração estimada:** 4-5 dias
**Dependências:** Gate 4 passou ✅ (mas pode iniciar em paralelo com Fase 4 se desejado)

### Execução Paralela Fase 5

```
AGENTE PRINCIPAL (Tasks 5.1-5.4)    SUBAGENTE TESTES (Task 5.T)
────────────────────────────────    ────────────────────────────
Scaffold site                        Escreve gate5-site.test.ts
Landing page                         (fluxo checkout, onboarding)
Planos + Mercado Pago
Onboarding + entrevista psico
        ↓                                    ↓
        └────────── MERGE ──────────────────┘
                     ↓
              ✅ RODAR GATE 5
```

### Task 5.1: Scaffold site

**Files:** `site/` inteiro

- [ ] **Step 1:** `npm create vite@latest site -- --template react-ts`
- [ ] **Step 2:** Instalar: tailwindcss, @tailwindcss/vite, react-router-dom, lucide-react
- [ ] **Step 3:** Commit

### Task 5.2: Landing Page

**Files:** `site/src/pages/LandingPage.tsx`

- [ ] **Step 1:** Seções: Hero, Comparação (vs ChatGPT vs Professor Particular), Como Funciona (3 passos), Os 8 Professores (cards), Segurança, Pricing, CTA final
- [ ] **Step 2:** Commit

### Task 5.3: Planos + Checkout Mercado Pago

**Files:** `site/src/pages/PlansPage.tsx`, `site/src/pages/CheckoutPage.tsx`, `server/src/routes/payment.ts`

- [ ] **Step 1:** PlansPage — 2 cards (Base R$49,90 / Familiar R$79,90)
- [ ] **Step 2:** Backend POST /api/payment/create-preference — cria preferência Mercado Pago
- [ ] **Step 3:** Backend POST /api/payment/webhook — recebe notificação, se pago → cria família no Supabase
- [ ] **Step 4:** CheckoutPage — redireciona para Mercado Pago ou embede Checkout Bricks
- [ ] **Step 5:** Commit

### Task 5.4: Onboarding pós-compra

**Files:** `site/src/pages/OnboardingPage.tsx`, `site/src/components/OnboardingForm.tsx`, `site/src/components/PsychoForm.tsx`

- [ ] **Step 1:** Etapa 1 — Dados responsável: nome, email (pré-preenchido), criar senha, criar PIN 4 dígitos
- [ ] **Step 2:** Etapa 2 — Dados filho(s): nome, série (dropdown 1º ao 3º EM), idade. Repetir conforme plano (1 ou 3).
- [ ] **Step 3:** Etapa 3 — Entrevista psicopedagógica digital (18 perguntas do FORMULARIO_ONBOARDING.md):
  - 1 pergunta por vez
  - Tipos: única escolha, múltipla escolha, sim/não com detalhe, texto livre
  - Aceitar "PULAR" em opcionais (Q10, Q18)
- [ ] **Step 4:** Etapa 4 — Confirmação + "Acessar Super Agentes" → redireciona para /app
- [ ] **Step 5:** Salvar: criar responsável (PIN hash), criar aluno(s) (entrevista_psico como JSONB)
- [ ] **Step 6:** Commit

---

### Task 5.T: Testes Gate 5 (SUBAGENTE)

**Files:** `server/tests/gate5-site.test.ts`

```typescript
// === GATE 5: SITE SAAS ===

// PAYMENT
test('POST /api/payment/create-preference retorna URL do Mercado Pago')
test('POST /api/payment/webhook com payment approved → cria família no Supabase')
test('Família criada tem plano correto (base ou familiar)')
test('Família criada tem max_filhos e max_dispositivos corretos')

// ONBOARDING
test('Criar responsável com PIN hash → PIN é validável depois')
test('Criar aluno com entrevista_psico JSONB → dados persistidos')
test('Plano base → aceita 1 filho, rejeita 2º')
test('Plano familiar → aceita até 3 filhos')
test('Após onboarding → login funciona com email+senha criados')
test('Após onboarding → perfil do filho aparece na seleção')

// ENTREVISTA
test('18 perguntas são salvas como JSONB em b2c_alunos.entrevista_psico')
test('Respostas opcionais (Q10, Q18) aceitam null')
```

---

### 🚦 GATE 5: GO/NO-GO — Site SaaS

```bash
cd server && npm run gate:5
```

| # | Teste | Resultado |
|---|-------|----------|
| 1 | Mercado Pago preference | ✅ |
| 2 | Webhook → cria família | ✅ |
| 3 | Onboarding completo | ✅ |
| 4 | Login pós-onboarding | ✅ |
| 5 | Entrevista salva em JSONB | ✅ |

**VERIFICAÇÃO VISUAL MANUAL:**
- [ ] Navegar landing page no browser
- [ ] Testar fluxo: landing → plano → checkout (sandbox Mercado Pago) → onboarding → app
- [ ] Verificar responsividade mobile

**Se FAIL → Debug. Se PASS → Avançar.**

---

## 9. Fase 6: Deploy + Teste Final

**Duração estimada:** 2-3 dias
**Dependências:** Gate 5 passou ✅

### Task 6.1: Build de produção

**Files:** Modify `server/src/index.ts`, create `railway.json`

- [ ] **Step 1:** Build web e site: `cd web && npm run build` + `cd site && npm run build`
- [ ] **Step 2:** Express serve static:
  - `/app/*` → web/dist/ (app educacional)
  - `/*` → site/dist/ (site SaaS — fallback)
  - `/api/*` → rotas API (prioridade)
- [ ] **Step 3:** railway.json com buildCommand sequencial (server + web + site)
- [ ] **Step 4:** Commit

### Task 6.2: Deploy Railway

- [ ] **Step 1:** Push para GitHub
- [ ] **Step 2:** Criar projeto Railway conectado ao repo
- [ ] **Step 3:** Configurar variáveis de ambiente (SUPABASE, LLM, JWT, QDRANT, MERCADO_PAGO)
- [ ] **Step 4:** Deploy + verificar /api/health
- [ ] **Step 5:** Testar fluxo em produção

---

### 🚦 GATE 6: GO/NO-GO — RELEASE

**Teste Final E2E (gate6-e2e.test.ts) — roda contra produção:**

```typescript
// === GATE 6: RELEASE ===

// FLUXO COMPLETO (simula jornada real)
test('Landing → escolher plano base → checkout sandbox → onboarding → login → chat')

// 8 HERÓIS EM PRODUÇÃO
for (const heroi of HEROIS) {
  test(`${heroi.nome}: 3 turnos em produção funcionam`)
}

// MODO PAI EM PRODUÇÃO
test('Pai com PIN: login → chat modo pai → CALCULUS orientação parental')

// SUPERVISOR EM PRODUÇÃO
test('Pai → Supervisor → recebe resumo com dados reais')

// PERFORMANCE
test('Cascata <10s em produção')
test('Continuidade <3s em produção')

// SEGURANÇA
test('Acesso sem token → 401')
test('Aluno de outra família → 403')
test('PIN errado → 403')
```

**Critérios RELEASE (TODOS obrigatórios):**

| # | Critério (do PRE_PLANEJAMENTO) | Gate |
|---|-------------------------------|------|
| 1 | 8 professores funcionando (3 turnos cada) | ✅ Gate 2 + Gate 6 |
| 2 | MODO PAI funcional em todos | ✅ Gate 2 |
| 3 | SUPERVISOR resumo semanal real | ✅ Gate 4 + Gate 6 |
| 4 | Login + PIN do pai | ✅ Gate 1 + Gate 6 |
| 5 | 3 interfaces corretas | ✅ Gate 3 |
| 6 | SSE streaming <10s/<3s | ✅ Gate 2 + Gate 6 |
| 7 | Persistência completa | ✅ Gate 1 |
| 8 | Flush semanal (CRON → Qdrant → limpeza) | ✅ Gate 4 |
| 9 | Site SaaS (landing + planos + checkout + onboarding) | ✅ Gate 5 |
| 10 | Mercado Pago Pix funcional | ✅ Gate 5 |
| 11 | Limite suave funcionando | ✅ Gate 1 + Gate 4 |

**Se TODOS ✅ → 🚀 RELEASE V1.0**

---

## 10. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Gemini ignora JSON novos heróis | Alta | Médio | instrucaoFormato com few-shot (validado CALCULUS/VERBETTA) |
| Latência cascata Gemini | Média | Alto | Kimi K2.5 em prod é mais rápido. Router inteligente mitiga. |
| Qdrant indisponível | Baixa | Médio | Graceful degradation no SUPERVISOR |
| Mercado Pago webhook falha | Média | Alto | Retry + status "pendente". Admin manual fallback. |
| Cold start Railway | Média | Médio | Health ping cada 5 min ou plano pago |
| Imagens muito grandes | Média | Baixo | Limitar 5MB no frontend, comprimir |
| PIN exposto | Baixa | Alto | bcrypt hash, HTTPS, nunca log |
| PROFESSOR_IA sem especificação | Alta | Médio | **Fase 2.5 dedicada** com Leon antes de implementar |

---

## 11. Decisões Técnicas

| Decisão | Justificativa |
|---------|--------------|
| Monorepo simples (sem workspaces) | 3 projetos independentes. Build sequencial. Simplicidade. |
| JWT para auth (não Supabase Auth) | Login simples email+senha+PIN. JWT leve suficiente. |
| bcrypt para senha e PIN | Padrão mercado. PIN 4 dígitos também recebe hash. |
| Tailwind CSS | Rápido, utilitário, responsivo. Sem overhead. |
| node-cron (não Edge Function) | CRON no mesmo server. Simples. |
| REST API Qdrant (sem SDK) | SDK pesado. fetch() basta. |
| Imagens base64 (não Storage) | V1 simplificada. V2 pode migrar para Storage. |
| Prefixo b2c_ | Isolamento produção (b2c_) vs teste (t6_) no mesmo banco. |
| **VERBETTA** (dois T) | Nome correto do prompt. Código teste6 usa "VERBETA" (corrigido na V1). |
| tsx --test (sem Jest) | Runner nativo do Node 20. Zero config. Suficiente para integration tests. |

---

## Cronograma Resumido

| Fase | Duração | Dia | Entregável | Gate |
|------|---------|-----|-----------|------|
| 1. Fundação Backend | 3-4 dias | 1-4 | Server + auth + 8 matérias + testes | Gate 1 |
| 2. Agentes | 3-4 dias | 5-8 | Todos heróis + modo pai + SUPERVISOR | Gate 2 |
| 2.5. Workshop PROFESSOR_IA | 1 dia | 9 | Prompt PROFESSOR_IA definido | — |
| 3. Frontend | 5-7 dias | 10-16 | App React + 3 interfaces + SSE | Gate 3 |
| 4. Infraestrutura | 3-4 dias | 17-20 | CRON + Qdrant + limites + devices | Gate 4 |
| 5. Site SaaS | 4-5 dias | 21-25 | Landing + checkout + onboarding | Gate 5 |
| 6. Deploy + Teste | 2-3 dias | 26-28 | Produção testada | Gate 6 (RELEASE) |

**Total estimado: ~4 semanas**

> **Regra de ouro:** Nenhuma fase avança sem o gate da fase anterior passar. Bugs encontrados nos gates são corrigidos ANTES de prosseguir.
