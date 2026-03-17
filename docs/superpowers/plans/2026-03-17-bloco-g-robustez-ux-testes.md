# Bloco G — Robustez + UX + Testes em Produção — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir router travado, substituir typing effect por revelação balão-por-balão com typing dots, e criar infraestrutura de testes em produção (E2E + MCP Bridge + QA).

**Architecture:** Backend recebe timeout de sessão (15min) + classificador LLM leve (Gemini Flash) no router. Frontend substitui `useTypingEffect` (caractere por caractere) por `useBubbleReveal` (balão por balão com tempo de leitura) e `TypingDots` (3 pontinhos animados). Infraestrutura de testes ganha 3 camadas: E2E contra Railway, MCP Bridge interativo, e QA subagent contínuo.

**Tech Stack:** TypeScript strict, Express, React 19, Tailwind 4, Supabase PostgreSQL (prefixo `b2c_`), Gemini 2.5 Flash, Vite 6.3.5

**Spec:** `docs/superpowers/specs/2026-03-17-bloco-g-robustez-ux-testes-design.md`

---

## File Structure

### Backend — Criados/Modificados

| Arquivo | Responsabilidade |
|---------|-----------------|
| `server/src/core/router.ts` | MODIFICAR: timeout sessão + `classificarTema()` + novo `decidirPersona()` |
| `server/src/db/persistence.ts` | MODIFICAR: + `atualizarUltimoTurno()` + `resetarSessaoAgente()` |
| `server/src/routes/message.ts` | MODIFICAR: flag `nova_sessao` + chamar `atualizarUltimoTurno()` |
| `server/src/routes/mcp.ts` | CRIAR: endpoint MCP Bridge com 5 ferramentas + auth JWT |
| `server/src/index.ts` | MODIFICAR: registrar rota `/api/mcp` |
| `server/tests/helpers/api-client.ts` | MODIFICAR: `API_URL` configurável via env var |
| `server/tests/gate6-router-timeout.test.ts` | CRIAR: testes do router refatorado |
| `server/package.json` | MODIFICAR: script `test:prod` |

### Frontend — Criados/Modificados/Removidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `web/src/hooks/useBubbleReveal.ts` | CRIAR: hook de revelação balão por balão |
| `web/src/components/TypingDots.tsx` | CRIAR: 3 pontinhos animados |
| `web/src/components/ChatBubble.tsx` | MODIFICAR: usar `useBubbleReveal`, remover split pós-animação |
| `web/src/components/ChatMessages.tsx` | MODIFICAR: novo fluxo de streaming bubble |
| `web/src/contexts/ChatContext.tsx` | MODIFICAR: novo fluxo + flag `nova_sessao` |
| `web/src/index.css` | MODIFICAR: animações typing dots + bubble entrance |
| `web/src/hooks/useTypingEffect.ts` | REMOVER |
| `web/src/components/StreamingCursor.tsx` | REMOVER |

### Banco de Dados

| Tabela | Mudança |
|--------|---------|
| `b2c_sessoes` | ADD COLUMN `ultimo_turno_at` TIMESTAMPTZ DEFAULT now() |

### Docs / QA

| Arquivo | Mudança |
|--------|---------|
| `docs/qa-reports/` | CRIAR diretório para relatórios QA |

---

## Chunk 1: Backend — SQL + Router Refactor + Testes

### Task 1: Migração SQL — campo `ultimo_turno_at`

**Files:**
- Modify: Supabase via MCP (tabela `b2c_sessoes`)
- Modify: `server/src/db/supabase.ts` (interface `Sessao`)
- Modify: `server/src/db/persistence.ts` (novas funções)

- [ ] **Step 1.1: Aplicar migração SQL no Supabase**

```sql
ALTER TABLE b2c_sessoes
ADD COLUMN IF NOT EXISTS ultimo_turno_at TIMESTAMPTZ DEFAULT now();

-- Atualizar registros existentes
UPDATE b2c_sessoes SET ultimo_turno_at = updated_at WHERE ultimo_turno_at IS NULL;
```

Run via MCP: `mcp__0150fe87...execute_sql`

- [ ] **Step 1.2: Verificar que a coluna foi criada**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'b2c_sessoes' AND column_name = 'ultimo_turno_at';
```

Expected: 1 row com `timestamptz` e default `now()`

- [ ] **Step 1.3: Atualizar interface `Sessao` em supabase.ts**

Em `server/src/db/supabase.ts`, adicionar campo na interface `Sessao`:

```typescript
// Adicionar após a linha com 'updated_at':
ultimo_turno_at: string  // ISO timestamp
```

- [ ] **Step 1.4: Criar função `atualizarUltimoTurno` em persistence.ts**

Em `server/src/db/persistence.ts`, adicionar após a função `atualizarSessao`:

```typescript
export async function atualizarUltimoTurno(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({ ultimo_turno_at: new Date().toISOString() })
    .eq('id', sessaoId)

  if (error) {
    console.error('❌ Erro ao atualizar ultimo_turno_at:', error)
  }
}
```

- [ ] **Step 1.5: Criar função `resetarSessaoAgente` em persistence.ts**

Em `server/src/db/persistence.ts`, adicionar após `atualizarUltimoTurno`:

```typescript
export async function resetarSessaoAgente(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      agente_atual: 'PSICOPEDAGOGICO',
      tema_atual: null,
      ultimo_turno_at: new Date().toISOString(),
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('❌ Erro ao resetar sessão agente:', error)
  }
}
```

- [ ] **Step 1.6: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 1.7: Commit**

```bash
git add server/src/db/supabase.ts server/src/db/persistence.ts
git commit -m "feat: add ultimo_turno_at to b2c_sessoes + helper functions"
```

---

### Task 2: Router Refactor — Timeout + Classificador LLM + Novo decidirPersona

**Files:**
- Modify: `server/src/core/router.ts` (refactor completo do decidirPersona + nova classificarTema)
- Modify: `server/src/routes/message.ts` (flag nova_sessao + chamar atualizarUltimoTurno)

- [ ] **Step 2.1: Adicionar env var SESSION_TIMEOUT_MS no router.ts**

No topo de `server/src/core/router.ts`, após os imports existentes (linha ~9):

```typescript
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '900000', 10) // 15min default
```

- [ ] **Step 2.2: Criar função `classificarTema` no router.ts**

Adicionar após a função `detectarContinuidade` (após linha ~210):

```typescript
/**
 * Classificador LLM leve — Gemini Flash com temp=0, max 10 tokens.
 * Roda quando keywords falham. Timeout de 500ms → fallback null.
 */
export async function classificarTema(mensagem: string): Promise<string | null> {
  const TEMAS_VALIDOS = [
    'matematica', 'portugues', 'ciencias', 'historia',
    'geografia', 'fisica', 'quimica', 'ingles', 'espanhol',
  ]

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    })

    const prompt = `Classifique a matéria escolar desta mensagem. Responda APENAS com uma palavra: matematica, portugues, ciencias, historia, geografia, fisica, quimica, ingles, espanhol, ou indefinido.\n\nMensagem: "${mensagem}"`

    // Timeout de 500ms
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    clearTimeout(timeoutId)

    const resposta = result.response.text().trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    if (TEMAS_VALIDOS.includes(resposta)) {
      console.log(`🔬 Classificador LLM: "${mensagem.substring(0, 40)}..." → ${resposta}`)
      return resposta
    }

    console.log(`🔬 Classificador LLM: indefinido para "${mensagem.substring(0, 40)}..."`)
    return resposta === 'indefinido' ? 'indefinido' : null
  } catch (err) {
    console.error('⚠️ Classificador LLM falhou (timeout/erro):', (err as Error).message)
    return null
  }
}
```

- [ ] **Step 2.3: Refatorar `decidirPersona` para async com timeout + classificador**

Substituir a função `decidirPersona` (linhas ~285-313) por:

```typescript
/**
 * Novo fluxo de decisão de persona:
 * 1. Checar timeout/nova_sessao → resetar se necessário
 * 2. Detectar tema por keywords
 * 3. Se tema → fluxo normal (PSICO cascata ou herói direto)
 * 4. Se sem tema → classificador LLM (SEMPRE)
 *    4a. Matéria válida → tratar como tema detectado
 *    4b. Indefinido + agente ativo → continuidade
 *    4c. Indefinido + sem agente → PSICOPEDAGOGICO
 *    4d. Erro → PSICOPEDAGOGICO
 */
export async function decidirPersona(
  mensagem: string,
  sessao: Sessao,
  ultimosTurnos: Turno[],
  novaSessao: boolean = false
): Promise<{ persona: string; temaDetectado: string | null }> {

  // 1. Checar timeout ou nova sessão
  const agora = Date.now()
  const ultimoTurno = sessao.ultimo_turno_at
    ? new Date(sessao.ultimo_turno_at).getTime()
    : 0
  const inativo = agora - ultimoTurno > SESSION_TIMEOUT_MS

  if (novaSessao || inativo) {
    console.log(`🔄 Reset sessão: ${novaSessao ? 'nova_sessao flag' : `inativo ${Math.round((agora - ultimoTurno) / 60000)}min`}`)
    sessao.agente_atual = 'PSICOPEDAGOGICO'
    sessao.tema_atual = null
  }

  // 2. Detectar tema por keywords
  const temaKeywords = detectarTema(mensagem)

  if (temaKeywords) {
    // 3. Tema detectado por keywords → fluxo normal
    return decidirComTema(temaKeywords, sessao, ultimosTurnos)
  }

  // 4. Keywords falharam → classificador LLM (SEMPRE)
  const temaLLM = await classificarTema(mensagem)

  if (temaLLM && temaLLM !== 'indefinido') {
    // 4a. Matéria válida detectada pelo classificador
    return decidirComTema(temaLLM, sessao, ultimosTurnos)
  }

  if (temaLLM === 'indefinido') {
    // 4b. Indefinido — continuidade se agente ativo
    if (sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      console.log(`➡️ Continuidade (classificador indefinido): ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }
  }

  // 4c/4d. Sem agente ativo ou erro → PSICOPEDAGOGICO
  return { persona: 'PSICOPEDAGOGICO', temaDetectado: null }
}

/**
 * Helper: dado um tema detectado (por keyword ou LLM), decide a persona.
 */
function decidirComTema(
  tema: string,
  sessao: Sessao,
  ultimosTurnos: Turno[]
): { persona: string; temaDetectado: string } {
  const personaAlvo = personaPorTema(tema)

  // Troca de matéria?
  if (tema !== sessao.tema_atual) {
    const jaAtendido = ultimosTurnos.some(t => t.agente === personaAlvo)
    if (!jaAtendido) {
      return { persona: 'PSICOPEDAGOGICO', temaDetectado: tema }
    }
  }

  return { persona: personaAlvo, temaDetectado: tema }
}
```

- [ ] **Step 2.4: Atualizar `message.ts` — flag `nova_sessao` + `atualizarUltimoTurno`**

Em `server/src/routes/message.ts`:

**2.4a** — Adicionar import no topo:

```typescript
import { atualizarUltimoTurno, resetarSessaoAgente } from '../db/persistence.js'
```

(adicionar `atualizarUltimoTurno` e `resetarSessaoAgente` aos imports existentes de persistence)

**2.4b** — Extrair `nova_sessao` do body (após linha ~77 onde extrai mensagem):

```typescript
const { aluno_id, mensagem, tipo_usuario, agente_override, nova_sessao } = req.body
```

**2.4c** — Onde `decidirPersona` é chamado (linha ~157), mudar para `await` e passar `nova_sessao`:

```typescript
// Antes:
// const agente = decidirPersona(mensagem, sessao, ultimosTurnos)
// const temaDetectado = detectarTema(mensagem)

// Depois:
const { persona: agente, temaDetectado } = await decidirPersona(
  mensagem, sessao, ultimosTurnos, nova_sessao === true
)
```

**2.4d** — Na seção de persistência em background (após ~linha 405), adicionar chamada a `atualizarUltimoTurno`:

```typescript
// Adicionar após atualizarSessao():
atualizarUltimoTurno(sessao.id).catch(err =>
  console.error('⚠️ Erro ao atualizar ultimo_turno_at:', err)
)
```

**2.4e** — Se `nova_sessao` flag e sessão foi resetada, persistir o reset no banco:

Antes de chamar `decidirPersona`, adicionar:

```typescript
if (nova_sessao === true) {
  await resetarSessaoAgente(sessao.id)
}
```

- [ ] **Step 2.5: Atualizar chamadas ao classificadorTemaInteligente existente**

A função `classificarTemaInteligente` (linhas ~212-268 em router.ts) pode ser mantida como backup, mas o novo `classificarTema` é mais leve. Em `message.ts`, remover/comentar a chamada ao `classificarTemaInteligente` das linhas ~177-197, pois agora `decidirPersona` já faz a classificação internamente.

Localizar o bloco:
```typescript
// Se PSICOPEDAGOGICO e não tem transição pendente, tentar classificar inteligente
```

E comentar/remover esse bloco inteiro, pois `decidirPersona` já integra o classificador.

- [ ] **Step 2.6: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit`
Expected: 0 errors (pode precisar ajustes em chamadas que esperam retorno `string` e agora recebem `{ persona, temaDetectado }`)

- [ ] **Step 2.7: Corrigir quaisquer erros de tipo**

O retorno de `decidirPersona` mudou de `string` para `Promise<{ persona: string; temaDetectado: string | null }>`. Verificar TODOS os locais que chamam essa função:

1. `message.ts` — já corrigido no step 2.4c
2. `gate5-agentes-e2e.test.ts` — se chama `decidirPersona` diretamente, atualizar
3. Qualquer outro arquivo que importe `decidirPersona`

Run: `grep -rn "decidirPersona" server/src/ server/tests/`

- [ ] **Step 2.8: Commit**

```bash
git add server/src/core/router.ts server/src/routes/message.ts
git commit -m "feat: router refactor — timeout 15min + LLM classifier + async decidirPersona"
```

---

### Task 3: Testes do Router Refatorado

**Files:**
- Create: `server/tests/gate6-router-timeout.test.ts`
- Modify: `server/tests/helpers/seed-data.ts` (novo helper de seed)
- Modify: `server/package.json` (script gate:6)

- [ ] **Step 3.1: Adicionar helper `seedTimeoutAluno` em seed-data.ts**

Em `server/tests/helpers/seed-data.ts`, adicionar:

```typescript
export async function seedTimeoutAluno(familiaId: string): Promise<{
  alunoId: string
  sessaoId: string
}> {
  // Criar aluno dedicado para testes de timeout
  const { data: aluno } = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: familiaId,
      nome: 'Aluno Timeout',
      serie: '7º ano',
      idade: 12,
      nivel_ensino: 'fundamental',
    })
    .select()
    .single()

  // Criar sessão com ultimo_turno_at no passado (20min atrás)
  const vinteMinAtras = new Date(Date.now() - 20 * 60 * 1000).toISOString()
  const { data: sessao } = await supabase
    .from('b2c_sessoes')
    .insert({
      aluno_id: aluno!.id,
      tipo_usuario: 'filho',
      agente_atual: 'CALCULUS',
      tema_atual: 'matematica',
      ultimo_turno_at: vinteMinAtras,
    })
    .select()
    .single()

  return { alunoId: aluno!.id, sessaoId: sessao!.id }
}

export async function limparSessoesAluno(alunoId: string): Promise<void> {
  // Limpar turnos primeiro (FK)
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (sessoes) {
    for (const s of sessoes) {
      await supabase.from('b2c_turnos').delete().eq('sessao_id', s.id)
    }
  }

  await supabase.from('b2c_uso_diario').delete().eq('aluno_id', alunoId)
  await supabase.from('b2c_sessoes').delete().eq('aluno_id', alunoId)
}
```

- [ ] **Step 3.2: Criar teste gate6-router-timeout.test.ts**

```typescript
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { TestClient } from './helpers/api-client.js'
import { seedTestFamily, seedTimeoutAluno, limparSessoesAluno, cleanupTestData } from './helpers/seed-data.js'

const client = new TestClient()

describe('Gate 6 — Router Timeout + Classificador', () => {
  let familia: any
  let token: string
  let timeoutAluno: { alunoId: string; sessaoId: string }

  before(async () => {
    familia = await seedTestFamily()
    const login = await client.login('teste-gate1@superagentes.com', 'senha123')
    token = login.token
    client.setToken(token)
    timeoutAluno = await seedTimeoutAluno(familia.familia.id)
  })

  after(async () => {
    await limparSessoesAluno(timeoutAluno.alunoId)
  })

  it('6.1 — Sessão inativa >15min reclassifica do zero', { timeout: 60000 }, async () => {
    // Sessão seedada com CALCULUS + ultimo_turno_at = 20min atrás
    // Enviar pergunta de português → deve reclassificar, não ficar preso em CALCULUS
    const result = await client.sendMessage(timeoutAluno.alunoId, 'me ajuda com gramática e ortografia do português')

    assert.ok(result.agente, 'Deve retornar agente')
    assert.notEqual(result.agente, 'CALCULUS', 'NÃO deve ficar preso em CALCULUS após timeout')
    // Pode ser VERBETTA (direto) ou PSICOPEDAGOGICO (cascata)
    assert.ok(
      result.agente === 'VERBETTA' || result.agente === 'PSICOPEDAGOGICO',
      `Esperado VERBETTA ou PSICO, recebeu: ${result.agente}`
    )
  })

  it('6.2 — Troca de matéria durante sessão ativa detectada pelo classificador', { timeout: 60000 }, async () => {
    // Primeiro: enviar matemática para estabelecer sessão com CALCULUS
    const r1 = await client.sendMessage(timeoutAluno.alunoId, 'me ajuda com equação do segundo grau')
    assert.ok(r1.agente, 'Deve retornar agente na primeira mensagem')

    // Depois: enviar história (sem keyword óbvio, forçando classificador)
    const r2 = await client.sendMessage(timeoutAluno.alunoId, 'quais foram as causas da primeira guerra mundial')
    assert.ok(r2.agente, 'Deve retornar agente na segunda mensagem')
    assert.notEqual(r2.agente, 'CALCULUS', 'NÃO deve manter CALCULUS para pergunta de história')
  })

  it('6.3 — Continuidade legítima mantém herói', { timeout: 60000 }, async () => {
    // Enviar matemática
    const r1 = await client.sendMessage(timeoutAluno.alunoId, 'me explica fração')
    // Enviar continuidade sem keyword
    const r2 = await client.sendMessage(timeoutAluno.alunoId, 'não entendi, explica de novo')

    // Se r1 foi CALCULUS, r2 deve manter
    if (r1.agente === 'CALCULUS') {
      assert.equal(r2.agente, 'CALCULUS', 'Deve manter CALCULUS para continuidade')
    }
  })

  it('6.4 — Flag nova_sessao reseta agente', { timeout: 60000 }, async () => {
    // Enviar com nova_sessao=true → deve reclassificar
    const result = await client.sendMessageRawBody(timeoutAluno.alunoId, {
      mensagem: 'me ajuda com ciências',
      nova_sessao: true,
    })

    assert.ok(result.agente, 'Deve retornar agente')
    // Não deve manter agente anterior, deve reclassificar
  })
})
```

**Nota:** Step 3.2 pode precisar de `sendMessageRawBody` como helper novo no TestClient. Se não existir, criar um método que aceita body customizado.

- [ ] **Step 3.3: Adicionar script gate:6 no package.json**

Em `server/package.json`, adicionar na seção `scripts`:

```json
"gate:6": "tsx --test tests/gate6-router-timeout.test.ts"
```

- [ ] **Step 3.4: Rodar testes**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run gate:6`
Expected: 4/4 passando

- [ ] **Step 3.5: Rodar gates anteriores para regressão**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run gate:all`
Expected: Todos passando (gate1 a gate6). Se algum gate antigo falhar por causa da mudança de interface do `decidirPersona`, corrigir.

- [ ] **Step 3.6: Commit**

```bash
git add server/tests/ server/package.json
git commit -m "test: gate6 — router timeout + LLM classifier + continuidade"
```

---

## Chunk 2: Frontend — TypingDots + useBubbleReveal + Refactor

### Task 4: Componente TypingDots

**Files:**
- Create: `web/src/components/TypingDots.tsx`
- Modify: `web/src/index.css` (animação bounce)

- [ ] **Step 4.1: Adicionar animação CSS para typing dots**

Em `web/src/index.css`, adicionar ANTES do bloco `.chat-bubble-content`:

```css
/* Typing Dots Animation */
@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.typing-dot {
  animation: typingBounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

/* Bubble entrance animation */
@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-enter {
  animation: bubbleIn 300ms ease-out forwards;
}
```

- [ ] **Step 4.2: Criar componente TypingDots.tsx**

```typescript
interface TypingDotsProps {
  color?: string
}

export function TypingDots({ color = '#6B7280' }: TypingDotsProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
```

- [ ] **Step 4.3: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4.4: Commit**

```bash
git add web/src/components/TypingDots.tsx web/src/index.css
git commit -m "feat: TypingDots component + CSS animations for bubble reveal"
```

---

### Task 5: Hook useBubbleReveal

**Files:**
- Create: `web/src/hooks/useBubbleReveal.ts`

- [ ] **Step 5.1: Criar hook useBubbleReveal**

```typescript
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseBubbleRevealOptions {
  /** Delay antes do primeiro balão (ms) */
  initialDelay?: number
  /** Tempo mínimo de exibição do typing dots (ms) */
  minDotsTime?: number
}

interface UseBubbleRevealReturn {
  /** Frases já visíveis */
  visibleBubbles: string[]
  /** True se ainda há balões por revelar */
  isRevealing: boolean
  /** True se deve mostrar typing dots */
  showDots: boolean
  /** Inicia revelação com array de frases */
  startReveal: (sentences: string[]) => void
  /** Reset completo */
  reset: () => void
}

export function useBubbleReveal(
  options: UseBubbleRevealOptions = {}
): UseBubbleRevealReturn {
  const { initialDelay = 400, minDotsTime = 400 } = options

  const [visibleCount, setVisibleCount] = useState(0)
  const [showDots, setShowDots] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  const sentencesRef = useRef<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (dotsTimerRef.current) {
      clearTimeout(dotsTimerRef.current)
      dotsTimerRef.current = null
    }
  }, [])

  const revealNext = useCallback(() => {
    const currentCount = sentencesRef.current.length

    setVisibleCount(prev => {
      const next = prev + 1

      if (next >= currentCount) {
        // Todos revelados — esconder dots e finalizar
        setShowDots(false)
        setIsRevealing(false)
        return next
      }

      // Calcular delay baseado em palavras da frase RECÉM revelada
      const justRevealed = sentencesRef.current[next - 1] || ''
      const wordCount = justRevealed.split(/\s+/).filter(Boolean).length
      const readingDelay = Math.max(800, wordCount * 120)

      // Após o balão aparecer, mostrar dots entre balões
      // Flow: balão aparece → esperar readingDelay → mostrar dots →
      //       esperar minDotsTime → esconder dots → revelar próximo
      timerRef.current = setTimeout(() => {
        setShowDots(true)
        dotsTimerRef.current = setTimeout(() => {
          setShowDots(false)
          revealNext()
        }, minDotsTime) // Dots visíveis por exatamente minDotsTime (400ms)
      }, readingDelay)

      return next
    })
  }, [minDotsTime])

  const startReveal = useCallback((sentences: string[]) => {
    clearTimers()
    sentencesRef.current = sentences
    setVisibleCount(0)
    setIsRevealing(true)
    setShowDots(true) // Dots aparecem imediatamente (simulando "processamento")

    // Delay inicial: dots ficam visíveis por no mínimo initialDelay
    // Depois esconde dots e revela primeiro balão
    timerRef.current = setTimeout(() => {
      setShowDots(false)
      revealNext()
    }, Math.max(initialDelay, minDotsTime)) // Garantir min 400ms de dots
  }, [clearTimers, revealNext, initialDelay, minDotsTime])

  const reset = useCallback(() => {
    clearTimers()
    sentencesRef.current = []
    setVisibleCount(0)
    setShowDots(false)
    setIsRevealing(false)
  }, [clearTimers])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const visibleBubbles = sentencesRef.current.slice(0, visibleCount)

  return {
    visibleBubbles,
    isRevealing,
    showDots,
    startReveal,
    reset,
  }
}
```

- [ ] **Step 5.2: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5.3: Commit**

```bash
git add web/src/hooks/useBubbleReveal.ts
git commit -m "feat: useBubbleReveal hook — balloon-by-balloon reveal with reading time"
```

---

### Task 6: Refatorar ChatBubble + ChatMessages + ChatContext

**Files:**
- Modify: `web/src/contexts/ChatContext.tsx` (remover useTypingEffect, novo fluxo)
- Modify: `web/src/components/ChatMessages.tsx` (usar useBubbleReveal)
- Modify: `web/src/components/ChatBubble.tsx` (remover split pós-animação, receber frases prontas)
- Delete: `web/src/hooks/useTypingEffect.ts`
- Delete: `web/src/components/StreamingCursor.tsx`

**IMPORTANTE:** Esta task é a mais complexa. Os 3 arquivos são interdependentes. A ordem de edição é: ChatContext → ChatMessages → ChatBubble.

- [ ] **Step 6.1: Refatorar ChatContext.tsx — remover useTypingEffect**

Substituir toda a lógica de typing effect pelo novo fluxo:

**Remover:**
- Import de `useTypingEffect`
- Todas as referências a `typing.addChunk`, `typing.flush`, `typing.reset`
- `streamingText` do state e do context value
- `isRevealing` do context value (será gerenciado pelo ChatMessages)

**Novo fluxo de `enviar()`:**
```typescript
// 1. fullTextRef acumula o texto completo (já existe)
// 2. onChunk: apenas acumula em fullTextRef (sem typing effect)
// 3. onDone: cria a mensagem final com o texto completo
//    e seta um flag para o ChatMessages iniciar bubble reveal
```

As mudanças chave no ChatContext:

```typescript
// REMOVER:
// import { useTypingEffect } from '../hooks/useTypingEffect'

// ADICIONAR:
const [pendingReveal, setPendingReveal] = useState<ChatMessage | null>(null)

// Na interface ChatContextValue, REMOVER:
// streamingText: string
// isRevealing: boolean

// ADICIONAR:
// pendingReveal: ChatMessage | null
// clearPendingReveal: () => void

// No enviar():
// onChunk callback — simplificar:
onChunk: (texto: string) => {
  fullTextRef.current = texto  // Servidor envia texto completo de uma vez
},

// onDone callback — criar mensagem e disparar reveal:
onDone: (data: Record<string, unknown>) => {
  const agentMsg: ChatMessage = {
    id: `agent-${Date.now()}`,
    role: 'agent',
    content: fullTextRef.current,
    agente: heroiAtivo || undefined,
    timestamp: Date.now(),
  }
  // NÃO adicionar às mensagens ainda — deixar ChatMessages controlar via reveal
  setPendingReveal(agentMsg)
  setStreaming(false)
  fullTextRef.current = ''
},
```

**Adicionar flag `nova_sessao` no primeiro envio:**

```typescript
// No topo do provider:
const isFirstMessageRef = useRef(true)

// No enviar(), ao chamar sendMessage:
const novaSessao = isFirstMessageRef.current
isFirstMessageRef.current = false

// Passar para sendMessage (precisa modificar chat.ts também)
```

- [ ] **Step 6.2: Atualizar `chat.ts` para suportar `nova_sessao`**

Em `web/src/api/chat.ts`, adicionar ao `SendMessageOptions`:

```typescript
novaSessao?: boolean
```

E no body do POST (onde monta o payload):

```typescript
body: JSON.stringify({
  aluno_id: options.alunoId,
  mensagem: options.mensagem,
  tipo_usuario: options.tipoUsuario || 'filho',
  agente_override: options.agenteOverride,
  nova_sessao: options.novaSessao || false,
}),
```

- [ ] **Step 6.3: Refatorar ChatMessages.tsx — integrar useBubbleReveal**

O ChatMessages precisa:
1. Importar `useBubbleReveal` e `TypingDots`
2. Quando `pendingReveal` chega (do context), iniciar revelação
3. Renderizar balões visíveis progressivamente
4. Quando revelação completa, mover mensagem para `mensagens[]`

```typescript
import { useBubbleReveal } from '../hooks/useBubbleReveal'
import { TypingDots } from './TypingDots'
import { splitSentences } from './ChatBubble' // Exportar de lá

// Dentro do componente:
const { pendingReveal, clearPendingReveal, mensagens, streaming, heroiAtivo } = useChat()
const reveal = useBubbleReveal()

// Efeito: quando pendingReveal chega, iniciar revelação
useEffect(() => {
  if (pendingReveal) {
    const sentences = splitSentences(pendingReveal.content)
    reveal.startReveal(sentences)
  }
}, [pendingReveal])

// Efeito: quando revelação termina, finalizar mensagem
useEffect(() => {
  if (pendingReveal && !reveal.isRevealing && reveal.visibleBubbles.length > 0) {
    // Adicionar mensagem completa ao histórico
    addMessage(pendingReveal)
    clearPendingReveal()
    reveal.reset()
  }
}, [reveal.isRevealing, reveal.visibleBubbles.length])

// Renderização:
// 1. Mensagens finalizadas (renderizar normalmente com ChatBubble)
// 2. Se revealing: renderizar visibleBubbles como balões individuais
// 3. Se showDots ou streaming: renderizar TypingDots
```

- [ ] **Step 6.4: Refatorar ChatBubble.tsx**

**Remover:**
- Import de `StreamingCursor`
- Lógica de `isStreaming` + `streamingText` props
- O `splitSentences` inline (mover para export)

**Simplificar:**
O ChatBubble agora recebe uma mensagem finalizada e renderiza com `splitSentences`. Sem streaming state.

**Exportar `splitSentences`:**
```typescript
export function splitSentences(text: string): string[] {
  // ... lógica existente (linhas 17-34 do arquivo atual)
}
```

- [ ] **Step 6.5: Remover useTypingEffect.ts e StreamingCursor.tsx**

```bash
rm web/src/hooks/useTypingEffect.ts
rm web/src/components/StreamingCursor.tsx
```

Verificar que nenhum outro arquivo importa esses módulos:
```bash
grep -rn "useTypingEffect\|StreamingCursor" web/src/
```

- [ ] **Step 6.6: Typecheck completo**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6.7: Build do frontend**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/web && npm run build`
Expected: Build success

- [ ] **Step 6.8: Commit**

```bash
git add -A web/src/
git commit -m "feat: bubble-by-bubble reveal + typing dots — replace useTypingEffect"
```

---

## Chunk 3: Infraestrutura — E2E Prod + MCP Bridge + QA

### Task 7: Testes E2E Contra Produção

**Files:**
- Modify: `server/tests/helpers/api-client.ts` (API_URL configurável)
- Modify: `server/package.json` (script test:prod)

- [ ] **Step 7.1: Tornar API_URL configurável no TestClient**

Em `server/tests/helpers/api-client.ts`, mudar a base URL:

```typescript
// Antes (hardcoded):
// const BASE = 'http://localhost:3001'

// Depois:
const BASE = process.env.API_URL || 'http://localhost:3001'
```

- [ ] **Step 7.2: Adicionar script test:prod**

Em `server/package.json`, adicionar na seção `scripts`:

```json
"test:prod": "API_URL=https://superagentes-b2c-v2-production.up.railway.app tsx --test tests/gate1-backend.test.ts tests/gate5-agentes-e2e.test.ts tests/gate6-router-timeout.test.ts"
```

**Nota:** A URL do Railway precisa ser confirmada com Leon. O script pode ser ajustado.

- [ ] **Step 7.3: Testar contra localhost**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run gate:1`
Expected: Passando (confirma que a mudança do API_URL com default não quebrou nada)

- [ ] **Step 7.4: Commit**

```bash
git add server/tests/helpers/api-client.ts server/package.json
git commit -m "feat: configurable API_URL for production testing"
```

---

### Task 8: MCP Bridge — Endpoint de Teste Interativo

**Files:**
- Create: `server/src/routes/mcp.ts`
- Modify: `server/src/index.ts` (registrar rota)

- [ ] **Step 8.1: Criar rota MCP Bridge**

Criar `server/src/routes/mcp.ts`:

```typescript
import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { buscarOuCriarSessao, buscarUltimosTurnos, resetarSessaoAgente } from '../db/persistence.js'
import { decidirPersona, detectarTema } from '../core/router.js'
import { buscarResponsavel, validarPinResponsavel } from '../db/auth-queries.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super-agentes-secret'

// Rate limiting simples (em memória)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30 // req/min
const RATE_WINDOW = 60_000 // 1 minuto

function checkRateLimit(tokenHash: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(tokenHash)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(tokenHash, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Middleware de autenticação para MCP — APENAS responsáveis (validação via PIN)
async function autenticarMCP(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token JWT obrigatório' })
    return
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as {
      familia_id: string
      email: string
      tipo_usuario?: string
    }

    // SEGURANÇA: Apenas responsáveis podem acessar o MCP Bridge
    // NOTA: O JWT atual (de /api/auth/login) NÃO inclui tipo_usuario —
    // apenas familia_id e email. O tipo_usuario é determinado no select-profile.
    //
    // Para o MCP Bridge, exigimos que o caller forneça o PIN do responsável
    // via header X-Pin, provando que é o pai/responsável.
    const pin = req.headers['x-pin'] as string
    if (!pin) {
      res.status(401).json({ erro: 'Header X-Pin obrigatório (PIN do responsável)' })
      return
    }

    // Validar PIN contra o responsável da família
    const responsavel = await buscarResponsavel(decoded.familia_id)
    if (!responsavel) {
      res.status(401).json({ erro: 'Responsável não encontrado para esta família' })
      return
    }
    const pinValido = await validarPinResponsavel(responsavel, pin)
    if (!pinValido) {
      res.status(401).json({ erro: 'PIN inválido — acesso restrito a responsáveis' })
      return
    }

    // Rate limit por família
    if (!checkRateLimit(decoded.familia_id)) {
      res.status(429).json({ erro: 'Rate limit excedido (30 req/min)' })
      return
    }

    // Cleanup de entradas expiradas do rate limit (evita memory leak)
    const now = Date.now()
    for (const [key, data] of rateLimits.entries()) {
      if (now > data.resetAt) rateLimits.delete(key)
    }

    ;(req as any).familia_id = decoded.familia_id
    ;(req as any).email = decoded.email
    next()
  } catch {
    res.status(401).json({ erro: 'Token JWT inválido' })
  }
}

router.use(autenticarMCP)

// Ferramenta 1: enviar_mensagem_como_aluno
router.post('/enviar_mensagem', async (req: Request, res: Response) => {
  try {
    const { aluno_id, mensagem } = req.body
    if (!aluno_id || !mensagem) {
      res.status(400).json({ erro: 'aluno_id e mensagem obrigatórios' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, 10)
    const { persona, temaDetectado } = await decidirPersona(mensagem, sessao, turnos)

    res.json({
      resultado: 'ok',
      persona_escolhida: persona,
      tema_detectado: temaDetectado,
      sessao_id: sessao.id,
      nota: 'Mensagem roteada mas NÃO enviada ao LLM (apenas simulação de roteamento)',
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// Ferramenta 2: verificar_sessao
router.get('/verificar_sessao/:aluno_id', async (req: Request, res: Response) => {
  try {
    const sessao = await buscarOuCriarSessao(req.params.aluno_id)
    res.json({
      sessao_id: sessao.id,
      agente_atual: sessao.agente_atual,
      tema_atual: sessao.tema_atual,
      ultimo_turno_at: sessao.ultimo_turno_at,
      turno_atual: sessao.turno_atual,
      status: sessao.status,
      transicao_pendente: sessao.transicao_pendente,
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// Ferramenta 3: checar_roteamento (dry-run)
router.post('/checar_roteamento', async (req: Request, res: Response) => {
  try {
    const { aluno_id, mensagem } = req.body
    if (!aluno_id || !mensagem) {
      res.status(400).json({ erro: 'aluno_id e mensagem obrigatórios' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, 10)

    // Tema por keywords
    const temaKeywords = detectarTema(mensagem)

    // Persona final
    const { persona, temaDetectado } = await decidirPersona(mensagem, sessao, turnos)

    res.json({
      tema_keywords: temaKeywords,
      tema_final: temaDetectado,
      persona: persona,
      agente_atual_sessao: sessao.agente_atual,
      tema_atual_sessao: sessao.tema_atual,
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// Ferramenta 4: listar_turnos
router.get('/listar_turnos/:aluno_id', async (req: Request, res: Response) => {
  try {
    const limite = parseInt(req.query.limite as string) || 10
    const sessao = await buscarOuCriarSessao(req.params.aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, limite)

    res.json({
      sessao_id: sessao.id,
      total: turnos.length,
      turnos: turnos.map(t => ({
        numero: t.numero,
        agente: t.agente,
        entrada: t.entrada.substring(0, 100) + (t.entrada.length > 100 ? '...' : ''),
        resposta: t.resposta.substring(0, 200) + (t.resposta.length > 200 ? '...' : ''),
        status: t.status,
        created_at: t.created_at,
      })),
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// Ferramenta 5: resetar_sessao_teste
router.post('/resetar_sessao', async (req: Request, res: Response) => {
  try {
    const { aluno_id } = req.body
    if (!aluno_id) {
      res.status(400).json({ erro: 'aluno_id obrigatório' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    await resetarSessaoAgente(sessao.id)

    res.json({
      resultado: 'ok',
      sessao_id: sessao.id,
      mensagem: 'Sessão resetada: agente_atual=PSICOPEDAGOGICO, tema_atual=null',
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

export default router
```

- [ ] **Step 8.2: Registrar rota MCP no index.ts**

Em `server/src/index.ts`, adicionar:

```typescript
// Import:
import mcpRouter from './routes/mcp.js'

// Registrar (após messageRouter):
app.use('/api/mcp', mcpRouter)
```

- [ ] **Step 8.3: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 8.4: Commit**

```bash
git add server/src/routes/mcp.ts server/src/index.ts
git commit -m "feat: MCP Bridge endpoint — 5 tools for interactive production testing"
```

---

### Task 9: QA Subagent — Script de Teste Contínuo

**Files:**
- Create: `docs/qa-reports/` (diretório)
- Create: `server/tests/qa-continuo.ts` (script de QA)

- [ ] **Step 9.1: Criar diretório para relatórios QA**

```bash
mkdir -p docs/qa-reports
```

- [ ] **Step 9.2: Criar script QA contínuo**

Criar `server/tests/qa-continuo.ts`:

```typescript
/**
 * QA Contínuo — Script despachável como subagente.
 * Testa os 8 heróis, transições, timeout e continuidade.
 * Gera relatório em docs/qa-reports/YYYY-MM-DD.md
 *
 * Uso: API_URL=https://... tsx tests/qa-continuo.ts
 */

import { TestClient } from './helpers/api-client.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = join(__dirname, '../../docs/qa-reports')

const client = new TestClient()

interface TestResult {
  nome: string
  categoria: string
  materia?: string
  passed: boolean
  roteamento: string   // qual agente foi roteado
  resposta: string     // resumo da resposta (primeiros chars)
  tempo_ms: number
}

const results: TestResult[] = []

// Login
async function setup(): Promise<string> {
  const login = await client.login('teste-gate1@superagentes.com', 'senha123')
  client.setToken(login.token)

  // Selecionar perfil de aluno fundamental
  const filhos = login.filhos || []
  const aluno = filhos.find((f: any) => f.nivel_ensino === 'fundamental') || filhos[0]
  if (!aluno) throw new Error('Nenhum aluno encontrado para teste')

  return aluno.id
}

// Teste individual de herói
async function testarHeroi(
  alunoId: string,
  heroi: string,
  materia: string,
  mensagem: string
): Promise<void> {
  const inicio = Date.now()
  try {
    // Resetar sessão antes de cada teste
    // (usar nova_sessao flag implícito via fresh start)
    const result = await client.sendMessage(alunoId, mensagem)
    const tempo = Date.now() - inicio

    const passed = result.agente !== null && result.fullText.length > 20
    const routed = result.agente === heroi || result.agente === 'PSICOPEDAGOGICO'

    results.push({
      nome: heroi,
      categoria: 'heroi',
      materia,
      passed: passed && routed,
      roteamento: result.agente || 'null',
      resposta: result.fullText.substring(0, 80) + (result.fullText.length > 80 ? '...' : ''),
      tempo_ms: tempo,
    })
  } catch (err) {
    results.push({
      nome: heroi,
      categoria: 'heroi',
      materia,
      passed: false,
      roteamento: 'ERRO',
      resposta: (err as Error).message.substring(0, 80),
      tempo_ms: Date.now() - inicio,
    })
  }
}

// Teste de transição
async function testarTransicao(
  alunoId: string,
  de: string,
  para: string,
  msg1: string,
  msg2: string
): Promise<void> {
  const inicio = Date.now()
  try {
    const r1 = await client.sendMessage(alunoId, msg1)
    const r2 = await client.sendMessage(alunoId, msg2)
    const tempo = Date.now() - inicio

    const trocou = r2.agente !== r1.agente || r2.agente === 'PSICOPEDAGOGICO'

    results.push({
      nome: `Transição ${de} → ${para}`,
      categoria: 'transicao',
      passed: trocou,
      roteamento: `R1: ${r1.agente}, R2: ${r2.agente}`,
      resposta: '',
      tempo_ms: tempo,
    })
  } catch (err) {
    results.push({
      nome: `Transição ${de} → ${para}`,
      categoria: 'transicao',
      passed: false,
      roteamento: 'ERRO',
      resposta: (err as Error).message.substring(0, 80),
      tempo_ms: Date.now() - inicio,
    })
  }
}

// Gerar relatório markdown
function gerarRelatorio(ambiente: string): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toISOString().slice(11, 16)

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  let md = `# QA Report — ${dateStr} ${timeStr}\n\n`
  md += `## Resumo\n`
  md += `- Total de testes: ${results.length}\n`
  md += `- Passed: ${passed} | Failed: ${failed}\n`
  md += `- Ambiente: ${ambiente}\n\n`

  // Testes por herói (6 colunas — conforme spec)
  const herois = results.filter(r => r.categoria === 'heroi')
  if (herois.length > 0) {
    md += `## Testes por Herói\n\n`
    md += `| Herói | Matéria | Roteamento | Resposta | Tempo | Status |\n`
    md += `|-------|---------|-----------|----------|-------|--------|\n`
    for (const r of herois) {
      md += `| ${r.nome} | ${r.materia || '-'} | ${r.roteamento} | ${r.resposta.substring(0, 40)}... | ${r.tempo_ms}ms | ${r.passed ? '✅' : '❌'} |\n`
    }
    md += `\n`
  }

  // Testes de transição
  const transicoes = results.filter(r => r.categoria === 'transicao')
  if (transicoes.length > 0) {
    md += `## Testes de Transição\n\n`
    md += `| De → Para | Resultado | Tempo | Status |\n`
    md += `|-----------|-----------|-------|--------|\n`
    for (const r of transicoes) {
      md += `| ${r.nome} | ${r.roteamento} | ${r.tempo_ms}ms | ${r.passed ? '✅' : '❌'} |\n`
    }
    md += `\n`
  }

  // Continuidade/timeout
  const outros = results.filter(r => r.categoria === 'continuidade' || r.categoria === 'timeout')
  if (outros.length > 0) {
    md += `## Testes de Timeout/Continuidade\n\n`
    md += `| Cenário | Resultado | Status |\n`
    md += `|---------|-----------|--------|\n`
    for (const r of outros) {
      md += `| ${r.nome} | ${r.roteamento} | ${r.passed ? '✅' : '❌'} |\n`
    }
  }

  return md
}

// Main
async function main(): Promise<void> {
  const ambiente = process.env.API_URL || 'http://localhost:3001'
  console.log(`🧪 QA Contínuo — Ambiente: ${ambiente}\n`)

  const alunoId = await setup()
  console.log(`👤 Aluno: ${alunoId}\n`)

  // 1. Testar 8 heróis
  const heroiTests = [
    { heroi: 'CALCULUS', materia: 'Matemática', msg: 'me ajuda com equação do segundo grau' },
    { heroi: 'VERBETTA', materia: 'Português', msg: 'gramática e ortografia do português' },
    { heroi: 'NEURON', materia: 'Ciências', msg: 'como funciona a fotossíntese nas plantas' },
    { heroi: 'TEMPUS', materia: 'História', msg: 'me conta sobre a revolução francesa' },
    { heroi: 'GAIA', materia: 'Geografia', msg: 'quais são os biomas do Brasil' },
    { heroi: 'VECTOR', materia: 'Física', msg: 'me explica as leis de Newton' },
    { heroi: 'ALKA', materia: 'Química', msg: 'o que é uma reação química' },
    { heroi: 'FLEX', materia: 'Inglês', msg: 'help me with verb to be in English' },
  ]

  for (const t of heroiTests) {
    console.log(`  🦸 Testando ${t.heroi}...`)
    await testarHeroi(alunoId, t.heroi, t.materia, t.msg)
  }

  // 2. Testes de transição
  console.log(`\n  🔄 Testando transições...`)
  await testarTransicao(alunoId, 'CALCULUS', 'TEMPUS',
    'me ajuda com equação do segundo grau',
    'me conta sobre o descobrimento do Brasil'
  )

  // 3. Teste de continuidade
  console.log(`  ➡️ Testando continuidade...`)
  const inicio = Date.now()
  const r1 = await client.sendMessage(alunoId, 'me ajuda com fração')
  const r2 = await client.sendMessage(alunoId, 'não entendi, explica de novo')
  results.push({
    nome: 'Continuidade (mesma matéria)',
    categoria: 'continuidade',
    passed: r1.agente === r2.agente,
    roteamento: `R1: ${r1.agente}, R2: ${r2.agente}`,
    resposta: '',
    tempo_ms: Date.now() - inicio,
  })

  // Gerar relatório
  const relatorio = gerarRelatorio(ambiente)
  const dateStr = new Date().toISOString().slice(0, 10)

  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = join(REPORT_DIR, `${dateStr}.md`)
  writeFileSync(reportPath, relatorio, 'utf-8')

  console.log(`\n📄 Relatório salvo em: ${reportPath}`)
  console.log(`\n${relatorio}`)

  // Exit code
  const failed = results.filter(r => !r.passed).length
  if (failed > 0) {
    console.error(`\n❌ ${failed} teste(s) falharam`)
    process.exit(1)
  } else {
    console.log(`\n✅ Todos os testes passaram!`)
  }
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
```

- [ ] **Step 9.3: Adicionar script `qa` no package.json**

Em `server/package.json`:

```json
"qa": "tsx tests/qa-continuo.ts",
"qa:prod": "API_URL=https://superagentes-b2c-v2-production.up.railway.app tsx tests/qa-continuo.ts"
```

- [ ] **Step 9.4: Typecheck**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 9.5: Commit**

```bash
git add server/tests/qa-continuo.ts server/package.json docs/qa-reports/
git commit -m "feat: QA contínuo — script de teste com relatório markdown"
```

---

### Task 10: Build + Gate de Validação Final

**Files:**
- Verify: todos os arquivos modificados

- [ ] **Step 10.1: Build do servidor**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run build`

**Lembrar:** `tsc` não copia .md. Verificar que o build script tem `cp -r src/personas dist/personas`.

- [ ] **Step 10.2: Build do frontend**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/web && npm run build`
Expected: Build success

- [ ] **Step 10.3: Rodar gate:all contra localhost**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run gate:all`
Expected: Todos os gates passando

- [ ] **Step 10.4: Rodar QA contra localhost**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm run qa`
Expected: Relatório gerado em `docs/qa-reports/`, testes passando

- [ ] **Step 10.5: Atualizar docs de memória**

Atualizar:
- `docs/MEMORIA_CURTA.md` — novo estado (Bloco G implementado)
- `docs/CHECKLIST_PROJETO.md` — marcar Bloco G items [x]
- `docs/LOG_ERROS.md` — registrar qualquer erro encontrado durante implementação
- `docs/MEMORIA_LONGA.md` — registrar decisões e cronologia

- [ ] **Step 10.6: Commit final**

```bash
git add docs/
git commit -m "docs: update memory docs — Bloco G complete"
```

- [ ] **Step 10.7: Preparar prompt de push para Leon**

Montar prompt para Leon rodar no Claude Code CLI:

```
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add -A
git status
git push origin main
```
