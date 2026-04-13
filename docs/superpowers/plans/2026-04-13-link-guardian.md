# Link Guardian Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar Hook 0 em `/api/message` que detecta URLs nas mensagens dos alunos, aciona Super Prova para investigar o conteúdo via Gemini, e injeta o KB resultante no contexto do herói — com branch para pedir contexto quando o link chega sem explicação.

**Architecture:** Bloco isolado ("quadrado dentro do círculo") inserido em `message.ts` após reset de sessão e antes de `decidirPersona()`. Dois novos arquivos de lógica pura (`detect-url.ts` e `investigar-link.ts`). Mudanças mínimas no DB layer (1 campo, 2 tipos). Nenhum arquivo existente de herói ou fluxo PSICO→Herói é tocado.

**Tech Stack:** TypeScript strict, Express SSE, Gemini 2.5 Flash (Google Generative AI SDK), Supabase PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-04-13-link-guardian-design.md`

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `server/src/db/supabase.ts` | **Modificar** | Adicionar `link_pendente: string \| null` à interface `Sessao` |
| `server/src/db/persistence.ts` | **Modificar** | Adicionar `link_pendente?: string \| null` ao tipo de updates de `atualizarSessao` |
| `server/src/utils/detect-url.ts` | **Criar** | Função pura `detectarURL()` — regex + threshold |
| `server/src/super-prova/investigar-link.ts` | **Criar** | `investigarLink()` — Gemini lê URL, retorna KB string |
| `server/src/super-prova/index.ts` | **Modificar** | Exportar `investigarLink` via re-export |
| `server/src/routes/message.ts` | **Modificar** | Inserir Hook 0 + imports |
| Migration SQL (Supabase MCP) | **Executar** | `ALTER TABLE b2c_sessoes ADD COLUMN IF NOT EXISTS link_pendente TEXT` |

**Ordem obrigatória:** DB layer primeiro — `sessao.link_pendente` precisa estar tipado antes de qualquer uso em `message.ts`.

---

## Chunk 1: DB Layer — `link_pendente`

### Task 1: Migration SQL no Supabase

**Files:**
- Migration SQL via Supabase MCP

- [ ] **Step 1: Executar migration via Supabase MCP**

Usar `mcp__supabase__execute_sql` com projeto `ahopvaekwejpsxzzrvux`:

```sql
ALTER TABLE b2c_sessoes ADD COLUMN IF NOT EXISTS link_pendente TEXT DEFAULT NULL;
```

- [ ] **Step 2: Confirmar que a coluna existe**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'b2c_sessoes' AND column_name = 'link_pendente';
```

Expected: 1 linha com `column_name = 'link_pendente'`, `data_type = 'text'`, `is_nullable = 'YES'`.

### Task 2: Atualizar interface `Sessao` em `supabase.ts`

**Files:**
- Modify: `server/src/db/supabase.ts`

- [ ] **Step 1: Adicionar campo à interface `Sessao`**

Localizar a interface `Sessao` (linha ~74). Adicionar `link_pendente` após `ultimo_turno_at`:

```typescript
export interface Sessao {
  id: string
  aluno_id: string
  responsavel_id: string | null
  tipo_usuario: 'filho' | 'pai'
  turno_atual: number
  agente_atual: string
  tema_atual: string | null
  plano_ativo: string | null
  historico_resumido: string | null
  status: 'ativa' | 'pausada' | 'encerrada'
  instrucoes_pendentes: string | null
  agente_destino: string | null
  transicao_pendente: boolean
  created_at: string
  updated_at: string
  ultimo_turno_at: string
  link_pendente: string | null  // URL aguardando contexto do aluno (Hook 0 — Link Guardian)
}
```

### Task 3: Atualizar `atualizarSessao()` em `persistence.ts`

**Files:**
- Modify: `server/src/db/persistence.ts`

- [ ] **Step 1: Adicionar `link_pendente` ao tipo de `updates`**

Localizar a função `atualizarSessao` e adicionar ao objeto `updates`:

```typescript
export async function atualizarSessao(
  sessaoId: string,
  updates: {
    turno_atual?: number
    agente_atual?: string
    tema_atual?: string | null
    plano_ativo?: string | null
    status?: Sessao['status']
    instrucoes_pendentes?: string | null
    agente_destino?: string | null
    transicao_pendente?: boolean
    link_pendente?: string | null  // ← adicionar aqui
  }
): Promise<void>
```

- [ ] **Step 2: TypeCheck**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server
npx tsc --noEmit
```

Expected: 0 erros.

---

## Chunk 2: `detect-url.ts` — Função Pura

### Task 4: Criar `server/src/utils/detect-url.ts`

**Files:**
- Create: `server/src/utils/detect-url.ts` (pasta `utils/` ainda não existe — criar junto)

- [ ] **Step 1: Criar a pasta e o arquivo**

```typescript
// server/src/utils/detect-url.ts
// Detecção de URLs em mensagens de alunos — função pura, zero dependências externas

const URL_REGEX = /https?:\/\/[^\s]+/i

export interface DeteccaoURL {
  url: string
  temContexto: boolean  // true se houver ≥10 chars de texto além da URL
}

/**
 * Detecta a primeira URL com protocolo explícito (https?://) na mensagem.
 * Retorna null se nenhuma URL encontrada.
 *
 * Regra de contexto: ≥10 chars de texto além da URL = aluno deu contexto suficiente.
 *
 * Exemplos:
 *   "https://historia.com/q"            → temContexto: false (0 chars)
 *   "veja https://historia.com/q"       → temContexto: false (4 chars — pede contexto)
 *   "sobre quilombos https://..."       → temContexto: true  (14 chars ✅)
 *   "www.historia.com"                  → null  (sem protocolo, não detectado)
 *   "v1.0.3"                            → null  (sem protocolo, não detectado)
 *   "Eu.não.sei.essa.matéria"           → null  (sem protocolo, não detectado)
 */
export function detectarURL(texto: string): DeteccaoURL | null {
  const match = texto.match(URL_REGEX)
  if (!match) return null

  const url = match[0]
  const textoAlem = texto.replace(url, '').trim()

  return {
    url,
    temContexto: textoAlem.length >= 10,
  }
}
```

- [ ] **Step 2: TypeCheck**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server
npx tsc --noEmit
```

Expected: 0 erros.

---

## Chunk 3: `investigar-link.ts` — Super Prova Lê URL

### Task 5: Criar `server/src/super-prova/investigar-link.ts`

**Files:**
- Create: `server/src/super-prova/investigar-link.ts`

Seguir o padrão de `consultar.ts` (Gemini, fail-silently, logs estruturados):

- [ ] **Step 1: Criar o arquivo**

```typescript
// server/src/super-prova/investigar-link.ts
// Investiga URL específica enviada pelo aluno via Gemini + Google Search Grounding.
// Retorna KB como string para persistirKnowledgeBase(). Fail-silently: nunca lança.

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

/**
 * Lê o conteúdo de uma URL e retorna string formatada como Knowledge Base.
 * Retorna null em qualquer falha (fail-silently — padrão Super Prova).
 */
export async function investigarLink(
  url: string,
  contexto: string,
  serie: string,
  heroiId: string
): Promise<string | null> {
  console.log(`[SuperProva:investigar-link] 🔗 Iniciando | url: "${url.slice(0, 80)}" | herói: ${heroiId} | série: ${serie}`)

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      // @ts-ignore — googleSearch suportado em @google/generative-ai ≥0.21
      tools: [{ googleSearch: {} }],
    })

    const prompt = `Você é um assistente pedagógico especializado em educação básica brasileira.

Leia o conteúdo da URL abaixo e crie um resumo pedagógico para o professor ${heroiId}, que vai ensinar um aluno do ${serie}.

URL: ${url}

O que o aluno pediu: "${contexto}"

Responda com exatamente este formato (texto simples, sem JSON, sem markdown):

CONTEÚDO DO LINK: ${url}
TEMA CENTRAL: [tema principal em 1 frase objetiva]
RESUMO: [3-5 parágrafos do conteúdo principal, linguagem adequada ao ${serie}]
CONCEITOS-CHAVE: [3-5 termos importantes separados por vírgula]
INTENÇÃO DO ALUNO: [o que o aluno quer estudar ou fazer com este conteúdo]

Regras:
- Linguagem adequada ao ${serie} (aluno brasileiro, BNCC)
- Se não conseguir ler o link, descreva o que inferiu pelo URL e contexto
- Máximo 800 caracteres no total`

    const inicio = Date.now()
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const tempoMs = Date.now() - inicio

    console.log(`[SuperProva:investigar-link] ✅ Concluído em ${tempoMs}ms | chars: ${text.length}`)

    if (!text || text.length < 50) {
      console.error(`[SuperProva:investigar-link] ❌ Resposta insuficiente: "${text.slice(0, 100)}"`)
      return null
    }

    return text

  } catch (err) {
    console.error(`[SuperProva:investigar-link] ❌ Erro:`, err)
    return null
  }
}
```

### Task 6: Exportar `investigarLink` via `super-prova/index.ts`

**Files:**
- Modify: `server/src/super-prova/index.ts`

- [ ] **Step 1: Adicionar import e re-export**

No topo do arquivo (junto com outros imports):

```typescript
import { investigarLink } from './investigar-link.js'
```

Na seção de exports públicos do módulo (junto com `obterOuGerarAcervo`, `processarConsulta` etc.):

```typescript
export { investigarLink }
```

`message.ts` importará via `'../super-prova/index.js'` — mesmo padrão dos demais exports do módulo.

- [ ] **Step 2: TypeCheck**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server
npx tsc --noEmit
```

Expected: 0 erros.

---

## Chunk 4: Hook 0 em `message.ts`

### Task 7: Inserir Hook 0

**Files:**
- Modify: `server/src/routes/message.ts`

**Posição exata:** após o bloco `if (nova_sessao === true) { await resetarSessaoAgente(sessao.id) }`, antes de `let { persona, temaDetectado } = await decidirPersona(...)`.

- [ ] **Step 1: Adicionar `detectarURL` e `investigarLink` aos imports**

Localizar o import de `super-prova/index.js` (linha ~39) e adicionar `investigarLink`:

```typescript
import {
  obterOuGerarAcervo,
  formatarKnowledgeBase,
  processarConsulta,
  processarQuiz,
  investigarLink,        // ← adicionar
} from '../super-prova/index.js'
```

Adicionar import de `detect-url`:

```typescript
import { detectarURL } from '../utils/detect-url.js'
```

- [ ] **Step 2: Inserir bloco Hook 0**

```typescript
// ── HOOK 0 — LINK GUARDIAN ──────────────────────────────────────────────────
// Detecta URLs com protocolo https?:// na mensagem do aluno.
//
// Branch A — sem contexto (ou novo link substituindo pendente):
//   Salva URL em link_pendente, pergunta ao aluno do que se trata, encerra.
//
// Branch B — com contexto OU link_pendente preenchido de turno anterior:
//   Super Prova investiga URL via Gemini, injeta KB, limpa link_pendente.
//   Continua para decidirPersona() normalmente — herói terá o conteúdo disponível.
//
// Edge case: link_pendente já existe + nova URL chega → nova URL sobrescreve.
// (O aluno claramente quer investigar o novo link — comportamento mais simples.)
{
  const linkDetectado = detectarURL(mensagem)

  // Nova URL sempre tem prioridade sobre link_pendente anterior
  const linkParaInvestigar = linkDetectado?.url ?? sessao.link_pendente ?? null
  const temContextoLink    = linkDetectado?.temContexto || !!sessao.link_pendente

  if (linkParaInvestigar && !temContextoLink) {
    // Branch A: sem contexto — pedir explicação e aguardar próximo turno
    const nomeAluno = aluno.nome?.split(' ')[0] ?? ''
    await atualizarSessao(sessao.id, { link_pendente: linkParaInvestigar })
    enviarEvento('agente', { agente: sessao.agente_atual || 'PSICOPEDAGOGICO' })
    enviarEvento('chunk', {
      texto: `Oi, ${nomeAluno}! Antes de eu abrir esse link, me conta: do que ele trata e o que a gente vai estudar com ele?`
    })
    enviarEvento('done', {})
    res.end()
    return
  }

  if (linkParaInvestigar && temContextoLink) {
    // Branch B: com contexto — investigar agora, injetar KB, continuar fluxo
    enviarEvento('search', { texto: '🔍 analisando conteúdo do link...' })
    const kbLink = await investigarLink(
      linkParaInvestigar,
      mensagem,
      aluno.serie ?? '7ano',
      sessao.agente_atual ?? 'GAIA'
    ).catch(() => null)
    if (kbLink) {
      await persistirKnowledgeBase(sessao.id, kbLink).catch(() => {})
      console.log(`[LinkGuardian] ✅ KB injetado (${kbLink.length} chars) | url: "${linkParaInvestigar.slice(0, 60)}"`)
    } else {
      console.warn(`[LinkGuardian] ⚠️ investigarLink retornou null — herói responde sem KB do link`)
    }
    await atualizarSessao(sessao.id, { link_pendente: null }).catch(() => {})
    // ← sem return — continua para decidirPersona() normalmente
  }
}
// ── FIM HOOK 0 ────────────────────────────────────────────────────────────────
```

- [ ] **Step 3: TypeCheck completo**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit
```

Expected: 0 erros em ambos.

---

## Chunk 5: Verificação Final

### Task 8: Checar + Validar manualmente

- [ ] **Step 1: Confirmar arquivos novos**

```bash
ls /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/utils/detect-url.ts
ls /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/super-prova/investigar-link.ts
```

Expected: ambos sem erro.

- [ ] **Step 2: Confirmar `link_pendente` nos 3 arquivos**

```bash
grep -n "link_pendente" \
  /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/db/supabase.ts \
  /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/db/persistence.ts \
  /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/routes/message.ts
```

Expected: ≥1 ocorrência em cada arquivo.

- [ ] **Step 3: Confirmar posição do Hook 0**

```bash
grep -n "HOOK 0\|resetarSessaoAgente\|decidirPersona" \
  /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/routes/message.ts
```

Expected: linha `HOOK 0` aparece entre `resetarSessaoAgente` e `decidirPersona`.

- [ ] **Step 4: Validação manual — Branch A (link sem contexto)**

Enviar mensagem via API ou app com apenas uma URL (`https://brasil.escola.br/historia/quilombos`), sem texto adicional.

Expected:
- Resposta: `"Oi, [nome]! Antes de eu abrir esse link, me conta..."`
- No Supabase: `SELECT link_pendente FROM b2c_sessoes WHERE aluno_id = '[id]'` retorna a URL

- [ ] **Step 5: Validação manual — Branch B (contexto no próximo turno)**

Com `link_pendente` preenchido do passo anterior, enviar qualquer mensagem de contexto (ex: "é um texto sobre quilombos que minha professora mandou, quero fazer um resumo").

Expected:
- Log no Railway: `[LinkGuardian] ✅ KB injetado`
- Log no Railway: `[SuperProva:investigar-link] ✅ Concluído em Xms`
- Herói responde com conhecimento do link
- No Supabase: `link_pendente` voltou para `NULL`

- [ ] **Step 6: Validação manual — URL com contexto direto**

Enviar mensagem: `"sobre quilombos modernos https://brasil.escola.br/historia/quilombos"` (texto tem 23 chars além da URL).

Expected:
- Log: `[LinkGuardian] ✅ KB injetado` (sem passar pelo Branch A)
- Herói responde com conhecimento do link

- [ ] **Step 7: Validação — sem URL**

Enviar mensagem normal sem URL. Expected: nenhum log de LinkGuardian, fluxo normal.

- [ ] **Step 8: Atualizar CHECKLIST_PROJETO.md**

Adicionar nova seção:

```markdown
## Link Guardian — Hook 0 (2026-04-13)

- [x] **LG-1** Migration SQL: `link_pendente TEXT NULL` em `b2c_sessoes`
- [x] **LG-2** `supabase.ts`: campo `link_pendente: string | null` em interface `Sessao`
- [x] **LG-3** `persistence.ts`: `atualizarSessao()` aceita `link_pendente`
- [x] **LG-4** `detect-url.ts`: `detectarURL()` — regex `https?://` + threshold 10 chars
- [x] **LG-5** `investigar-link.ts`: `investigarLink()` — Gemini lê URL, fail-silently
- [x] **LG-6** `super-prova/index.ts`: exporta `investigarLink`
- [x] **LG-7** `message.ts`: Hook 0 (após reset, antes de decidirPersona)
- [x] **LG-8** TypeCheck 0 erros server + web
- [ ] **LG-PUSH** Push via Escape Hatch
```

- [ ] **Step 9: Escape Hatch para Leon**

```bash
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/utils/detect-url.ts server/src/super-prova/investigar-link.ts server/src/super-prova/index.ts server/src/db/supabase.ts server/src/db/persistence.ts server/src/routes/message.ts docs/superpowers/specs/2026-04-13-link-guardian-design.md docs/superpowers/plans/2026-04-13-link-guardian.md docs/CHECKLIST_PROJETO.md docs/MEMORIA_CURTA.md
git commit -m "feat: Link Guardian — Super Prova investiga URLs dos alunos (Hook 0)"
git push origin main
```
