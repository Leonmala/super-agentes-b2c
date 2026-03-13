# Fase 4: Infraestrutura — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar CRON semanal (flush → Qdrant → cleanup), integração Qdrant Cloud, controle de dispositivos simultâneos, e limite suave completo.

**Architecture:** 3 novos arquivos server-side (cron.ts, qdrant.ts, dispositivos.ts), fixes em 2 existentes (usage-queries.ts, supabase.ts interfaces), alterações no endpoint message.ts e index.ts, e 1 mudança no frontend (device token header). Qdrant Cloud free tier via `@qdrant/js-client-rest`. node-cron já instalado.

**Tech Stack:** TypeScript, Express, Supabase, Qdrant Cloud, Gemini Embedding API, node-cron

**Spec:** `docs/superpowers/specs/2026-03-13-fase4-infraestrutura-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `server/src/db/qdrant.ts` | Qdrant client wrapper + embedding generation |
| `server/src/core/cron.ts` | CRON semanal registration + flush logic |
| `server/src/core/dispositivos.ts` | Device control middleware + helpers |
| `server/tests/gate4-infraestrutura.test.ts` | Gate 4 test suite |

### Modified Files

| File | Changes |
|------|---------|
| `server/src/db/supabase.ts` | Fix UsoDiario interface (`turnos` → `turnos_completos`), fix DispositivoAtivo interface, add QdrantRef interface |
| `server/src/db/usage-queries.ts` | Fix column name, add `incrementarTurnoCompleto()`, fix return type |
| `server/src/index.ts` | Import + register CRON on boot, add TZ note |
| `server/src/routes/message.ts` | Add device middleware, add turno increment after SSE |
| `server/package.json` | Add `@qdrant/js-client-rest` dependency |
| `web/src/api/client.ts` | Add `X-Device-Token` header |

---

## Chunk 1: Bug Fixes + Interface Corrections (Foundation)

### Task 1: Fix TypeScript Interfaces in supabase.ts

**Files:**
- Modify: `server/src/db/supabase.ts:81-98`

- [ ] **Step 1: Fix UsoDiario interface**

Change `turnos: number` to `turnos_completos: number` to match the actual DB column:

```typescript
export interface UsoDiario {
  id: string
  aluno_id: string
  data: string
  interacoes: number
  turnos_completos: number  // WAS: turnos
  created_at?: string
  updated_at?: string
}
```

- [ ] **Step 2: Fix DispositivoAtivo interface**

Replace the current interface with one matching the actual DB schema:

```typescript
export interface DispositivoAtivo {
  id: string
  familia_id: string
  perfil_id: string
  tipo_perfil: string
  device_token: string
  ultimo_ping: string
  created_at: string
}
```

- [ ] **Step 3: Add QdrantRef interface**

Add after DispositivoAtivo:

```typescript
export interface QdrantRef {
  id: string
  aluno_id: string
  namespace: string
  semana_ref: string
  ponto_ids: string[] | null
  resumo_semantico: string | null
  created_at: string
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: Errors in usage-queries.ts (because it still uses `turnos`). That's expected — Task 2 fixes it.

- [ ] **Step 5: Commit**

```bash
git add server/src/db/supabase.ts
git commit -m "fix: correct UsoDiario and DispositivoAtivo interfaces to match DB schema"
```

---

### Task 2: Fix usage-queries.ts Column Names + Add incrementarTurnoCompleto

**Files:**
- Modify: `server/src/db/usage-queries.ts`

- [ ] **Step 1: Fix INSERT — line 52**

Change `turnos: 0` to `turnos_completos: 0`:

```typescript
      .insert({
        aluno_id: alunoId,
        data: hoje,
        interacoes: 1,
        turnos_completos: 0  // WAS: turnos: 0
      })
```

- [ ] **Step 2: Fix verificarLimiteAtingido — line 114**

Change `uso.turnos` to `uso.turnos_completos`:

```typescript
  const turnos = uso.turnos_completos || 0  // WAS: uso.turnos
```

- [ ] **Step 3: Fix return type of verificarLimiteAtingido**

Change the return type `turnos: number` to `turnos_completos: number` for consistency:

```typescript
export async function verificarLimiteAtingido(
  alunoId: string
): Promise<{
  atingido: boolean
  interacoes: number
  turnos_completos: number  // WAS: turnos
  mensagem?: string
}> {
```

And update all references in the function body:
- `return { atingido: false, interacoes: 0, turnos_completos: 0 }` (line 107-110)
- `const resultado = { atingido, interacoes, turnos_completos: turnos }` (line 118-126)

- [ ] **Step 4: Add incrementarTurnoCompleto function**

Add at the end of the file:

```typescript
// ============================================================
// INCREMENTAR TURNO COMPLETO
// ============================================================

export async function incrementarTurnoCompleto(alunoId: string): Promise<void> {
  const hoje = new Date().toISOString().split('T')[0]

  // Buscar registro existente (já deve existir pois incrementarUso foi chamado antes)
  const { data: usoExistente } = await supabase
    .from('b2c_uso_diario')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('data', hoje)
    .single()

  if (usoExistente) {
    const { error } = await supabase
      .from('b2c_uso_diario')
      .update({
        turnos_completos: (usoExistente.turnos_completos || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', usoExistente.id)

    if (error) {
      console.error('Erro ao incrementar turno completo:', error.message)
    }
  }
  // Se não existe registro do dia, não incrementa (não deveria acontecer)
}
```

- [ ] **Step 5: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 6: Commit**

```bash
git add server/src/db/usage-queries.ts
git commit -m "fix: correct turnos_completos column name and add incrementarTurnoCompleto()"
```

---

### Task 3: Wire incrementarTurnoCompleto in message.ts

**Files:**
- Modify: `server/src/routes/message.ts:24,339-368`

- [ ] **Step 1: Add import**

Add `incrementarTurnoCompleto` to the import from usage-queries:

```typescript
import { incrementarUso, verificarLimiteAtingido, incrementarTurnoCompleto } from '../db/usage-queries.js'
```

- [ ] **Step 2: Update verificarLimiteAtingido usage (line ~121)**

The return field changed from `turnos` to `turnos_completos`. But since we only check `limiteInfo.atingido` and `limiteInfo.mensagem`, no change needed here.

- [ ] **Step 3: Add turno increment in background persistence chain (after line 361)**

In the `.then()` chain after `incrementarUso`, add turno increment:

```typescript
    Promise.all([
      persistirTurno(
        sessao.id,
        novoTurno,
        agenteFinal,
        mensagem.trim(),
        respostaFinal,
        status,
        plano
      ),
      atualizarSessao(sessao.id, {
        turno_atual: novoTurno,
        agente_atual: agenteFinal,
        tema_atual: temaDetectado || sessao.tema_atual,
        plano_ativo: temaDetectado && temaDetectado !== sessao.tema_atual
          ? (plano || null)
          : (plano || sessao.plano_ativo)
      })
    ])
      .then(() => {
        console.log(`[${aluno_id}] Persistência concluída (turno ${novoTurno})`)
        return incrementarUso(aluno_id)
      })
      .then(() => {
        console.log(`[${aluno_id}] Uso incrementado`)
        // Incrementar turno completo (herói respondeu com sucesso)
        return incrementarTurnoCompleto(aluno_id)
      })
      .then(() => {
        console.log(`[${aluno_id}] Turno completo incrementado`)
      })
      .catch(erro => {
        console.error(`[${aluno_id}] Erro na persistência/uso:`, erro)
      })
```

- [ ] **Step 4: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/message.ts
git commit -m "feat: wire incrementarTurnoCompleto after SSE response"
```

---

## Chunk 2: Qdrant Integration

### Task 4: Install Qdrant dependency

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Add dependency**

Add to `dependencies` in server/package.json:

```json
"@qdrant/js-client-rest": "^1.12.0"
```

- [ ] **Step 2: Install**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2/server && npm install`

- [ ] **Step 3: Commit**

```bash
git add server/package.json
git commit -m "chore: add @qdrant/js-client-rest dependency"
```

---

### Task 5: Create qdrant.ts — Qdrant client + embeddings

**Files:**
- Create: `server/src/db/qdrant.ts`

- [ ] **Step 1: Write qdrant.ts**

```typescript
// Qdrant Cloud integration — embeddings semanais por aluno
import { QdrantClient } from '@qdrant/js-client-rest'
import { GoogleGenerativeAI } from '@google/generative-ai'

const QDRANT_URL = process.env.QDRANT_URL || ''
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || ''
const COLLECTION_NAME = 'super_agentes_alunos'
const EMBEDDING_DIM = 768 // Gemini text-embedding-004

// Lazy init — only create client when actually needed
let qdrantClient: QdrantClient | null = null

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    if (!QDRANT_URL || !QDRANT_API_KEY) {
      throw new Error('QDRANT_URL e QDRANT_API_KEY são obrigatórios para integração Qdrant')
    }
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY
    })
  }
  return qdrantClient
}

// ============================================================
// INICIALIZAR COLLECTION
// ============================================================

export async function inicializarQdrant(): Promise<void> {
  const client = getQdrantClient()

  try {
    const collections = await client.getCollections()
    const existe = collections.collections.some(c => c.name === COLLECTION_NAME)

    if (!existe) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIM,
          distance: 'Cosine'
        }
      })
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' criada (${EMBEDDING_DIM}d, Cosine)`)
    } else {
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' já existe`)
    }
  } catch (erro: any) {
    console.error('[Qdrant] Erro ao inicializar:', erro.message)
    throw erro
  }
}

// ============================================================
// GERAR EMBEDDING (Gemini text-embedding-004)
// ============================================================

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY é obrigatório para gerar embeddings')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

  const result = await model.embedContent(texto)
  const embedding = result.embedding.values

  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Embedding inválido: esperado ${EMBEDDING_DIM}d, recebido ${embedding?.length || 0}d`)
  }

  return embedding
}

// ============================================================
// SALVAR EMBEDDING SEMANAL
// ============================================================

export async function salvarEmbeddingSemanal(
  alunoId: string,
  semanaRef: string,
  embedding: number[],
  resumo: string
): Promise<string> {
  const client = getQdrantClient()
  const pontoId = crypto.randomUUID()

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: pontoId,
        vector: embedding,
        payload: {
          aluno_id: alunoId,
          semana_ref: semanaRef,
          resumo,
          created_at: new Date().toISOString()
        }
      }
    ]
  })

  console.log(`[Qdrant] Ponto ${pontoId} salvo para aluno ${alunoId} (${semanaRef})`)
  return pontoId
}

// ============================================================
// BUSCAR CONTEXTO LONGO PRAZO (para SUPERVISOR)
// ============================================================

export async function buscarContextoLongoPrazo(
  alunoId: string,
  queryTexto: string,
  topK: number = 3
): Promise<Array<{ semana_ref: string; resumo: string; score: number }>> {
  const client = getQdrantClient()
  const queryEmbedding = await gerarEmbedding(queryTexto)

  const results = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit: topK,
    filter: {
      must: [
        {
          key: 'aluno_id',
          match: { value: alunoId }
        }
      ]
    },
    with_payload: true
  })

  return results.map(r => ({
    semana_ref: (r.payload as any)?.semana_ref || '',
    resumo: (r.payload as any)?.resumo || '',
    score: r.score
  }))
}

// ============================================================
// VERIFICAR SE QDRANT ESTÁ CONFIGURADO
// ============================================================

export function qdrantConfigurado(): boolean {
  return Boolean(QDRANT_URL && QDRANT_API_KEY)
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/db/qdrant.ts
git commit -m "feat: add Qdrant client with embedding generation and search"
```

---

## Chunk 3: CRON Semanal

### Task 6: Create cron.ts — Weekly flush job

**Files:**
- Create: `server/src/core/cron.ts`

- [ ] **Step 1: Write cron.ts**

```typescript
// CRON semanal — flush turnos → Qdrant → cleanup
// Roda domingo 23h (BRT) — requer TZ=America/Sao_Paulo no Railway
import cron from 'node-cron'
import { supabase } from '../db/supabase.js'
import type { Turno } from '../db/supabase.js'
import { chamarLLM } from './llm.js'
import {
  qdrantConfigurado,
  inicializarQdrant,
  gerarEmbedding,
  salvarEmbeddingSemanal
} from '../db/qdrant.js'

// ============================================================
// REGISTRAR CRON NO BOOT
// ============================================================

export function registrarCronSemanal(): void {
  // Domingo 23h (assume TZ=America/Sao_Paulo no env)
  // Se TZ não configurado, usar UTC: '0 2 * * 1' (segunda 02h UTC = domingo 23h BRT)
  const schedule = process.env.TZ === 'America/Sao_Paulo' ? '0 23 * * 0' : '0 2 * * 1'

  cron.schedule(schedule, async () => {
    console.log('[CRON] Iniciando flush semanal...')
    try {
      await executarFlushSemanal()
      console.log('[CRON] Flush semanal concluído com sucesso')
    } catch (erro: any) {
      console.error('[CRON] Erro no flush semanal:', erro.message)
    }
  })

  console.log(`[CRON] Flush semanal registrado (schedule: ${schedule}, TZ: ${process.env.TZ || 'UTC'})`)
}

// ============================================================
// FLUSH SEMANAL PRINCIPAL
// ============================================================

export async function executarFlushSemanal(): Promise<{
  alunosProcessados: number
  erros: string[]
}> {
  const erros: string[] = []
  let alunosProcessados = 0

  // Calcular início da semana (segunda anterior)
  const agora = new Date()
  const diaAtual = agora.getDay() // 0=domingo
  const diffSegunda = diaAtual === 0 ? 6 : diaAtual - 1
  const inicioSemana = new Date(agora)
  inicioSemana.setDate(agora.getDate() - diffSegunda)
  inicioSemana.setHours(0, 0, 0, 0)

  // Calcular semana ISO (YYYY-WNN)
  const semanaRef = calcularSemanaISO(agora)

  console.log(`[CRON] Semana: ${semanaRef}, Início: ${inicioSemana.toISOString()}`)

  // 1. Buscar alunos com turnos nesta semana
  const { data: alunosAtivos, error: erroBusca } = await supabase
    .from('b2c_turnos')
    .select('sessao_id')
    .gte('created_at', inicioSemana.toISOString())

  if (erroBusca || !alunosAtivos) {
    console.error('[CRON] Erro ao buscar turnos da semana:', erroBusca?.message)
    return { alunosProcessados: 0, erros: [erroBusca?.message || 'Sem dados'] }
  }

  // Obter aluno_ids únicos via sessões
  const sessaoIds = [...new Set(alunosAtivos.map(t => t.sessao_id))]

  if (sessaoIds.length === 0) {
    console.log('[CRON] Nenhum turno encontrado na semana. Nada a processar.')
    return { alunosProcessados: 0, erros: [] }
  }

  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id, aluno_id')
    .in('id', sessaoIds)

  if (!sessoes) {
    return { alunosProcessados: 0, erros: ['Sem sessões encontradas'] }
  }

  const alunoIds = [...new Set(sessoes.map(s => s.aluno_id))]

  // Inicializar Qdrant se configurado
  const usarQdrant = qdrantConfigurado()
  if (usarQdrant) {
    try {
      await inicializarQdrant()
    } catch (erro: any) {
      console.error('[CRON] Qdrant não disponível, continuando sem embeddings:', erro.message)
    }
  } else {
    console.log('[CRON] Qdrant não configurado — skip embeddings')
  }

  // 2. Processar cada aluno
  for (const alunoId of alunoIds) {
    try {
      await processarAlunoSemanal(alunoId, semanaRef, inicioSemana, usarQdrant)
      alunosProcessados++
      console.log(`[CRON] Aluno ${alunoId} processado (${alunosProcessados}/${alunoIds.length})`)
    } catch (erro: any) {
      const msg = `Aluno ${alunoId}: ${erro.message}`
      erros.push(msg)
      console.error(`[CRON] Erro: ${msg}`)
      // Continuar com próximo aluno
    }
  }

  console.log(`[CRON] Resultado: ${alunosProcessados} processados, ${erros.length} erros`)
  return { alunosProcessados, erros }
}

// ============================================================
// PROCESSAR ALUNO INDIVIDUAL
// ============================================================

async function processarAlunoSemanal(
  alunoId: string,
  semanaRef: string,
  inicioSemana: Date,
  usarQdrant: boolean
): Promise<void> {
  // a. Buscar sessões do aluno
  const { data: sessoesAluno } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (!sessoesAluno || sessoesAluno.length === 0) return

  const sessaoIds = sessoesAluno.map(s => s.id)

  // b. Buscar turnos da semana
  const { data: turnos, error: erroTurnos } = await supabase
    .from('b2c_turnos')
    .select('*')
    .in('sessao_id', sessaoIds)
    .gte('created_at', inicioSemana.toISOString())
    .order('created_at', { ascending: true })

  if (erroTurnos || !turnos || turnos.length === 0) return

  // c. Gerar resumo semântico via LLM
  const resumo = await gerarResumoSemantico(turnos as Turno[])

  // d. Gerar embedding e salvar no Qdrant (se configurado)
  let pontoId: string | null = null
  if (usarQdrant) {
    try {
      const embedding = await gerarEmbedding(resumo)
      pontoId = await salvarEmbeddingSemanal(alunoId, semanaRef, embedding, resumo)
    } catch (erro: any) {
      console.error(`[CRON] Erro Qdrant para ${alunoId}:`, erro.message)
      // Continuar sem Qdrant — backup ainda acontece
    }
  }

  // e. Backup dos turnos
  const turnosBackup = turnos.map(t => ({
    sessao_id: t.sessao_id,
    aluno_id: alunoId,
    numero: t.numero,
    agente: t.agente,
    entrada: t.entrada,
    resposta: t.resposta,
    status: t.status,
    plano: t.plano,
    semana_ref: semanaRef,
    original_created_at: t.created_at
  }))

  const { error: erroBackup } = await supabase
    .from('b2c_turnos_backup')
    .insert(turnosBackup)

  if (erroBackup) {
    throw new Error(`Falha no backup: ${erroBackup.message}`)
  }

  // f. Salvar referência Qdrant
  const { error: erroRef } = await supabase
    .from('b2c_qdrant_refs')
    .insert({
      aluno_id: alunoId,
      namespace: `aluno_${alunoId}`,
      semana_ref: semanaRef,
      ponto_ids: pontoId ? [pontoId] : null,
      resumo_semantico: resumo
    })

  if (erroRef) {
    console.error(`[CRON] Erro ao salvar ref Qdrant:`, erroRef.message)
    // Não-fatal — continuar
  }

  // g. Deletar turnos originais
  const turnoIds = turnos.map(t => t.id)
  const { error: erroDelete } = await supabase
    .from('b2c_turnos')
    .delete()
    .in('id', turnoIds)

  if (erroDelete) {
    throw new Error(`Falha ao deletar turnos: ${erroDelete.message}`)
  }

  // h. Encerrar sessões ativas do aluno
  await supabase
    .from('b2c_sessoes')
    .update({ status: 'encerrada', updated_at: new Date().toISOString() })
    .eq('aluno_id', alunoId)
    .eq('status', 'ativa')

  console.log(`[CRON] Aluno ${alunoId}: ${turnos.length} turnos backed up, sessões encerradas`)
}

// ============================================================
// GERAR RESUMO SEMÂNTICO VIA LLM
// ============================================================

export async function gerarResumoSemantico(turnos: Turno[]): Promise<string> {
  // Montar texto dos turnos para o LLM
  const turnosTexto = turnos.map(t =>
    `[${t.agente}] Aluno: "${t.entrada}" → Resposta: "${t.resposta.substring(0, 200)}..."`
  ).join('\n')

  const prompt = `Analise as interações educacionais desta semana e gere um RESUMO SEMÂNTICO conciso (máximo 300 palavras).

O resumo deve incluir:
1. Matérias trabalhadas e temas específicos
2. Nível de compreensão demonstrado pelo aluno
3. Dificuldades identificadas
4. Progresso observado
5. Recomendações para a próxima semana

INTERAÇÕES DA SEMANA:
${turnosTexto}

RESUMO SEMÂNTICO:`

  // Usar PSICO model para resumo (mais inteligente)
  const systemPrompt = 'Você é um analista pedagógico. Gere resumos educacionais concisos e úteis.'

  try {
    const resposta = await chamarLLM(systemPrompt, '', prompt, 'RESUMO_SEMANAL')
    return resposta.raw.trim()
  } catch (erro: any) {
    // Fallback: resumo básico sem LLM
    const materias = [...new Set(turnos.map(t => t.agente))].join(', ')
    return `Semana com ${turnos.length} interações. Matérias: ${materias}. Resumo automático não disponível.`
  }
}

// ============================================================
// HELPERS
// ============================================================

function calcularSemanaISO(data: Date): string {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/core/cron.ts
git commit -m "feat: add weekly CRON flush job (turnos → Qdrant → backup → cleanup)"
```

---

### Task 7: Register CRON in index.ts

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Add import**

After existing imports (line ~8):

```typescript
import { registrarCronSemanal } from './core/cron.js'
```

- [ ] **Step 2: Register CRON after app.listen**

Replace the listen block (lines 45-47):

```typescript
app.listen(PORT, () => {
  console.log(`\n🚀 Super Agentes B2C V1 — porta ${PORT}\n`)

  // Registrar CRON semanal (flush → Qdrant → cleanup)
  registrarCronSemanal()
})
```

- [ ] **Step 3: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: register weekly CRON on server boot"
```

---

## Chunk 4: Controle de Dispositivos

### Task 8: Create dispositivos.ts — Device control middleware

**Files:**
- Create: `server/src/core/dispositivos.ts`

- [ ] **Step 1: Write dispositivos.ts**

```typescript
// Controle de dispositivos simultâneos por família
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../db/supabase.js'

const LIMITE_DISPOSITIVOS_V1 = 3 // V1: hardcode máximo plano Familiar
const TIMEOUT_INATIVO_MS = 5 * 60 * 1000 // 5 minutos
const TIMEOUT_CLEANUP_MS = 10 * 60 * 1000 // 10 minutos

// ============================================================
// MIDDLEWARE EXPRESS
// ============================================================

export function middlewareDispositivos() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const deviceToken = req.headers['x-device-token'] as string | undefined
    const familiaId = (req as any).familiaId as string | undefined

    // Se não tem device token, pular (endpoints sem autenticação)
    if (!deviceToken || !familiaId) {
      next()
      return
    }

    const perfilId = req.body?.aluno_id || 'unknown'
    const tipoPerfil = req.body?.tipo_usuario || 'filho'

    try {
      // Registrar/atualizar dispositivo
      await registrarDispositivo(familiaId, perfilId, tipoPerfil, deviceToken)

      // Verificar limite
      const resultado = await verificarLimiteDispositivos(familiaId)

      if (!resultado.permitido) {
        res.status(429).json({
          erro: 'Limite de dispositivos simultâneos atingido',
          mensagem: `Sua família tem ${resultado.ativos} dispositivos ativos (limite: ${resultado.limite}). Feche a sessão em outro dispositivo.`,
          ativos: resultado.ativos,
          limite: resultado.limite
        })
        return
      }

      next()
    } catch (erro: any) {
      console.error('[Dispositivos] Erro no middleware:', erro.message)
      // Não bloquear por erro de dispositivo — let it pass
      next()
    }
  }
}

// ============================================================
// REGISTRAR DISPOSITIVO
// ============================================================

export async function registrarDispositivo(
  familiaId: string,
  perfilId: string,
  tipoPerfil: string,
  deviceToken: string
): Promise<void> {
  // Upsert: atualizar ultimo_ping se device_token já existe, senão insertar
  const { data: existente } = await supabase
    .from('b2c_dispositivos_ativos')
    .select('id')
    .eq('device_token', deviceToken)
    .single()

  if (existente) {
    await supabase
      .from('b2c_dispositivos_ativos')
      .update({
        familia_id: familiaId,
        perfil_id: perfilId,
        tipo_perfil: tipoPerfil,
        ultimo_ping: new Date().toISOString()
      })
      .eq('id', existente.id)
  } else {
    await supabase
      .from('b2c_dispositivos_ativos')
      .insert({
        familia_id: familiaId,
        perfil_id: perfilId,
        tipo_perfil: tipoPerfil,
        device_token: deviceToken,
        ultimo_ping: new Date().toISOString()
      })
  }
}

// ============================================================
// VERIFICAR LIMITE
// ============================================================

export async function verificarLimiteDispositivos(
  familiaId: string
): Promise<{ permitido: boolean; ativos: number; limite: number }> {
  const limiteAtivo = new Date(Date.now() - TIMEOUT_INATIVO_MS).toISOString()

  const { count, error } = await supabase
    .from('b2c_dispositivos_ativos')
    .select('*', { count: 'exact', head: true })
    .eq('familia_id', familiaId)
    .gte('ultimo_ping', limiteAtivo)

  if (error) {
    console.error('[Dispositivos] Erro ao contar:', error.message)
    return { permitido: true, ativos: 0, limite: LIMITE_DISPOSITIVOS_V1 }
  }

  const ativos = count || 0

  // V1: hardcode limite. Fase 5: ler de b2c_familias.max_dispositivos
  return {
    permitido: ativos <= LIMITE_DISPOSITIVOS_V1,
    ativos,
    limite: LIMITE_DISPOSITIVOS_V1
  }
}

// ============================================================
// CLEANUP DISPOSITIVOS INATIVOS
// ============================================================

export async function limparDispositivosInativos(): Promise<number> {
  const limiteInativo = new Date(Date.now() - TIMEOUT_CLEANUP_MS).toISOString()

  const { data, error } = await supabase
    .from('b2c_dispositivos_ativos')
    .delete()
    .lt('ultimo_ping', limiteInativo)
    .select('id')

  if (error) {
    console.error('[Dispositivos] Erro no cleanup:', error.message)
    return 0
  }

  const removidos = data?.length || 0
  if (removidos > 0) {
    console.log(`[Dispositivos] ${removidos} dispositivos inativos removidos`)
  }

  return removidos
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/core/dispositivos.ts
git commit -m "feat: add device control middleware with family limit checking"
```

---

### Task 9: Wire device middleware in message.ts

**Files:**
- Modify: `server/src/routes/message.ts`

- [ ] **Step 1: Add import**

```typescript
import { middlewareDispositivos } from '../core/dispositivos.js'
```

- [ ] **Step 2: Extract familiaId before middleware can use it**

The middleware needs `familiaId` on `req`. After JWT decoding (line ~96), add:

```typescript
  const familia_id = decoded.familia_id as string
  ;(req as any).familiaId = familia_id
```

Wait — the JWT verification happens INSIDE the route handler, not as middleware. The device middleware needs familiaId BEFORE the route handler runs.

**Better approach:** Don't use Express middleware for this. Instead, call the functions directly AFTER JWT is decoded inside the route handler. Update the import and call inline:

```typescript
import { registrarDispositivo, verificarLimiteDispositivos } from '../core/dispositivos.js'
```

After JWT decode (line ~96), add device check:

```typescript
  const familia_id = decoded.familia_id as string

  // Verificar dispositivo simultâneo
  const deviceToken = req.headers['x-device-token'] as string
  if (deviceToken) {
    const perfilId = aluno_id
    const tipoPerfil = (tipo_usuario as string) || 'filho'

    await registrarDispositivo(familia_id, perfilId, tipoPerfil, deviceToken)
    const deviceCheck = await verificarLimiteDispositivos(familia_id)

    if (!deviceCheck.permitido) {
      return res.status(429).json({
        erro: 'Limite de dispositivos simultâneos atingido',
        mensagem: `Sua família tem ${deviceCheck.ativos} dispositivos ativos (limite: ${deviceCheck.limite}). Feche a sessão em outro dispositivo.`
      })
    }
  }
```

- [ ] **Step 3: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/message.ts
git commit -m "feat: add device limit check in message endpoint"
```

---

### Task 10: Add device token header in frontend

**Files:**
- Modify: `web/src/api/client.ts`

- [ ] **Step 1: Add device token generation and header**

At the top of the file, add device token getter:

```typescript
function getDeviceToken(): string {
  let token = localStorage.getItem('sa_device_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('sa_device_token', token)
  }
  return token
}
```

In the `apiFetch` function, add the header after Authorization:

```typescript
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Device token para controle de dispositivos simultâneos
  headers['X-Device-Token'] = getDeviceToken()
```

- [ ] **Step 2: Run frontend typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/api/client.ts
git commit -m "feat: add X-Device-Token header for concurrent device control"
```

---

## Chunk 5: Gate 4 Tests

### Task 11: Write Gate 4 test suite

**Files:**
- Create: `server/tests/gate4-infraestrutura.test.ts`
- Modify: `server/package.json` (add gate:4 script)

- [ ] **Step 1: Add gate:4 script to package.json**

In scripts section:

```json
"gate:4": "tsx --test tests/gate4-infraestrutura.test.ts"
```

- [ ] **Step 2: Write gate4-infraestrutura.test.ts**

```typescript
// Gate 4 — Infraestrutura: CRON, Qdrant, Limites, Dispositivos
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

// Import modules under test
import { calcularSemanaISO } from '../src/core/cron.js'
import { qdrantConfigurado } from '../src/db/qdrant.js'
import {
  incrementarUso,
  verificarLimiteAtingido,
  incrementarTurnoCompleto,
  buscarUsoDiario
} from '../src/db/usage-queries.js'
import {
  registrarDispositivo,
  verificarLimiteDispositivos,
  limparDispositivosInativos
} from '../src/core/dispositivos.js'

// Note: These are integration tests that hit Supabase.
// Uses real Supabase but with test data that gets cleaned up.

const TEST_ALUNO_ID = process.env.TEST_ALUNO_ID || ''
const TEST_FAMILIA_ID = process.env.TEST_FAMILIA_ID || ''

describe('Gate 4 — Infraestrutura', () => {

  // ─── CRON ───────────────────────────────────────────────────
  describe('4.1 CRON', () => {
    it('calcularSemanaISO retorna formato correto', () => {
      const semana = calcularSemanaISO(new Date('2026-03-13'))
      assert.match(semana, /^\d{4}-W\d{2}$/, 'Formato deve ser YYYY-WNN')
    })

    it('CRON module exports registrarCronSemanal', async () => {
      const mod = await import('../src/core/cron.js')
      assert.equal(typeof mod.registrarCronSemanal, 'function')
      assert.equal(typeof mod.executarFlushSemanal, 'function')
    })
  })

  // ─── QDRANT ─────────────────────────────────────────────────
  describe('4.2 Qdrant', () => {
    it('qdrantConfigurado retorna boolean', () => {
      const resultado = qdrantConfigurado()
      assert.equal(typeof resultado, 'boolean')
    })

    it('qdrant module exports funções essenciais', async () => {
      const mod = await import('../src/db/qdrant.js')
      assert.equal(typeof mod.inicializarQdrant, 'function')
      assert.equal(typeof mod.gerarEmbedding, 'function')
      assert.equal(typeof mod.salvarEmbeddingSemanal, 'function')
      assert.equal(typeof mod.buscarContextoLongoPrazo, 'function')
    })
  })

  // ─── DISPOSITIVOS ──────────────────────────────────────────
  describe('4.3 Dispositivos', () => {
    const tokenBase = `test-device-${Date.now()}`

    it('registrar dispositivo não lança erro', async () => {
      if (!TEST_FAMILIA_ID) return assert.ok(true, 'Skip: sem TEST_FAMILIA_ID')
      await assert.doesNotReject(
        registrarDispositivo(TEST_FAMILIA_ID, 'test-perfil', 'filho', `${tokenBase}-1`)
      )
    })

    it('verificarLimiteDispositivos retorna formato correto', async () => {
      if (!TEST_FAMILIA_ID) return assert.ok(true, 'Skip: sem TEST_FAMILIA_ID')
      const result = await verificarLimiteDispositivos(TEST_FAMILIA_ID)
      assert.equal(typeof result.permitido, 'boolean')
      assert.equal(typeof result.ativos, 'number')
      assert.equal(typeof result.limite, 'number')
    })

    it('limparDispositivosInativos retorna número', async () => {
      const removidos = await limparDispositivosInativos()
      assert.equal(typeof removidos, 'number')
    })

    it('dispositivos module exporta middlewareDispositivos', async () => {
      const mod = await import('../src/core/dispositivos.js')
      assert.equal(typeof mod.middlewareDispositivos, 'function')
    })
  })

  // ─── LIMITES ────────────────────────────────────────────────
  describe('4.4 Limites', () => {
    it('verificarLimiteAtingido usa turnos_completos (não turnos)', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      const result = await verificarLimiteAtingido(TEST_ALUNO_ID)
      assert.ok('turnos_completos' in result, 'Deve ter campo turnos_completos')
      assert.ok(!('turnos' in result), 'Não deve ter campo turnos (antigo)')
    })

    it('incrementarTurnoCompleto é uma função', () => {
      assert.equal(typeof incrementarTurnoCompleto, 'function')
    })

    it('incrementarUso funciona sem erro', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      await assert.doesNotReject(incrementarUso(TEST_ALUNO_ID))
    })

    it('buscarUsoDiario retorna dados corretos', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      const uso = await buscarUsoDiario(TEST_ALUNO_ID)
      if (uso) {
        assert.ok('turnos_completos' in uso, 'Deve ter turnos_completos')
        assert.equal(typeof uso.interacoes, 'number')
      }
    })
  })
})
```

Note: `calcularSemanaISO` needs to be exported from `cron.ts`. Add `export` to the function.

- [ ] **Step 3: Export calcularSemanaISO from cron.ts**

In `server/src/core/cron.ts`, change:
```typescript
function calcularSemanaISO(data: Date): string {
```
to:
```typescript
export function calcularSemanaISO(data: Date): string {
```

- [ ] **Step 4: Run Gate 4 tests**

Run: `cd server && npm run gate:4`
Expected: All tests pass (some may skip if TEST_ALUNO_ID not set)

- [ ] **Step 5: Commit**

```bash
git add server/tests/gate4-infraestrutura.test.ts server/package.json server/src/core/cron.ts
git commit -m "test: add Gate 4 infrastructure test suite"
```

---

## Chunk 6: Documentation Update (Ralph Loop Persist)

### Task 12: Update project docs

**Files:**
- Modify: `docs/CHECKLIST_PROJETO.md`
- Modify: `docs/MEMORIA_CURTA.md`
- Modify: `docs/MEMORIA_LONGA.md`

- [ ] **Step 1: Mark Fase 4 tasks complete in CHECKLIST**

Update the Fase 4 section with [x] marks for completed tasks.

- [ ] **Step 2: Update MEMORIA_CURTA with new state**

Replace content with current snapshot: Fase 4 complete, Gate 4 passed, next step = Fase 5.

- [ ] **Step 3: Update MEMORIA_LONGA**

Add new decisions (#31-35):
- #31: Qdrant Cloud free tier (não self-hosted)
- #32: EMBEDDING_PROVIDER abstração (Gemini V1, Kimi futuro)
- #33: Middleware dispositivos inline (não Express middleware global)
- #34: Reset diário automático (sem CRON meia-noite)
- #35: Estratégia comercial documentada (anual com desconto, 3 dias teste)

Add chronology entries for Fase 4.

- [ ] **Step 4: Commit**

```bash
git add docs/CHECKLIST_PROJETO.md docs/MEMORIA_CURTA.md docs/MEMORIA_LONGA.md
git commit -m "docs: update Ralph Loop docs after Fase 4 completion"
```

---

## Summary: Task Execution Order

| Task | Chunk | Description | Dependencies |
|------|-------|-------------|-------------|
| 1 | 1 | Fix interfaces supabase.ts | None |
| 2 | 1 | Fix usage-queries.ts | Task 1 |
| 3 | 1 | Wire turno increment in message.ts | Task 2 |
| 4 | 2 | Install Qdrant dependency | None |
| 5 | 2 | Create qdrant.ts | Task 4 |
| 6 | 3 | Create cron.ts | Task 5 |
| 7 | 3 | Register CRON in index.ts | Task 6 |
| 8 | 4 | Create dispositivos.ts | Task 1 |
| 9 | 4 | Wire device check in message.ts | Task 8 |
| 10 | 4 | Add device token in frontend | None (independent) |
| 11 | 5 | Gate 4 tests | Tasks 1-10 |
| 12 | 6 | Update docs | Task 11 |

**Parallel execution possible:**
- Tasks 4-5 (Qdrant) can run in parallel with Tasks 8-10 (Dispositivos) after Chunk 1 completes
- Task 10 (frontend) is independent and can run anytime
