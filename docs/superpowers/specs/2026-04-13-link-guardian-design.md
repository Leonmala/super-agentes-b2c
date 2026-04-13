# Link Guardian — Design Spec

**Data:** 2026-04-13  
**Autor:** Lucas Pessoa  
**Status:** Aprovado por Leon — v2 pós-revisão  

---

## Problema

Hoje, quando um aluno manda uma URL no chat, o herói ativo (ex: GAIA) a processa usando seu próprio LLM. Isso funciona enquanto os heróis usam Gemini — que tem Google Search Grounding e pode ler URLs. Quando os heróis migrarem para Kimi K2.5 (sem capacidade de busca nativa), esse comportamento vai quebrar silenciosamente.

Além disso, não há distinção entre "link com intenção clara" e "link solto sem contexto" — os dois chegam ao herói da mesma forma.

---

## Solução

**Hook 0 — Link Guardian:** bloco de detecção e tratamento de URLs que roda no início do handler `/api/message`, após verificações de limite e reset de sessão, antes de qualquer roteamento. Isolado do fluxo principal. Quando termina, o fluxo circular existente continua intacto.

Metáfora: **um quadrado acontecendo dentro de um círculo.** O círculo não sabe que o quadrado existiu — só recebe o KB pronto.

---

## Arquitetura

```
POST /api/message
        ↓
  [autenticação JWT]
  [buscar aluno + sessão]
  [verificar dispositivo]
  [verificar limite de uso]  ← Hook 0 NÃO roda antes disso
  [reset nova_sessao]
        ↓
┌───────────────────────────────────────┐
│         HOOK 0 — LINK GUARDIAN        │  ← entra aqui, após linha ~215
│                                       │
│  1. detectarURL(mensagem)             │
│     → null: segue fluxo normal        │
│     → { url, temContexto }:           │
│                                       │
│  2a. SEM contexto + sem link_pendente │
│      → resposta hardcoded             │
│      → salva link_pendente na sessão  │
│      → res.end()  ← saiu aqui        │
│                                       │
│  2b. TEM contexto OU link_pendente    │
│      → emit SSE 'search'              │
│      → await investigarLink()         │
│      → persistirKnowledgeBase()       │
│      → limpa link_pendente            │
└───────────────────────────────────────┘
        ↓
  decidirPersona() — FLUXO EXISTENTE (inalterado)
  PSICO → Herói → SSE stream → persist
```

**Posição exata em `message.ts`:** após o bloco `if (nova_sessao === true) { await resetarSessaoAgente(...) }` (≈ linha 215), antes da chamada a `decidirPersona()` (≈ linha 217).

---

## Componentes

### 1. `detectarURL(texto: string)` — `server/src/utils/detect-url.ts`

Função pura, ~10 linhas.

**Regra de detecção:** somente URLs com protocolo explícito `https?://`. Nenhuma heurística de domínio, nenhuma detecção de `www.`, nenhuma regex ambígua.

**Threshold de contexto:** 10 caracteres de texto além da URL (não 20). Evita falsos negativos em frases curtas como "veja isso" (9 chars) ou "o que é?" (8 chars) — limites aceitáveis. "sobre quilombos" (14 chars), "leia esse artigo" (16 chars) e similares sempre passam.

```typescript
const URL_REGEX = /https?:\/\/[^\s]+/i

export function detectarURL(texto: string): { url: string; temContexto: boolean } | null {
  const match = texto.match(URL_REGEX)
  if (!match) return null
  const url = match[0]
  const textoAlem = texto.replace(url, '').trim()
  return { url, temContexto: textoAlem.length >= 10 }
}
```

**Exemplos:**

| Entrada | Resultado |
|---------|-----------|
| `"https://historia.com/quilombos"` | `{ url: "https://...", temContexto: false }` |
| `"veja https://historia.com/quilombos"` | `{ url: "https://...", temContexto: false }` (4 chars — pede contexto) |
| `"sobre quilombos https://historia.com"` | `{ url: "https://...", temContexto: true }` (14 chars ✅) |
| `"leia esse artigo https://..."` | `{ url: "https://...", temContexto: true }` (16 chars ✅) |
| `"www.historia.com"` | `null` — não detectado |
| `"Eu.não.sei.essa.matéria"` | `null` — não detectado |
| `"v1.0.3"` | `null` — não detectado |
| `"arquivo.txt"` | `null` — não detectado |

---

### 2. `investigarLink()` — `server/src/super-prova/investigar-link.ts`

Função nova no módulo Super Prova. Mesmos padrões do módulo: Gemini, fail-silently, retorna `null` em caso de erro.

```typescript
export async function investigarLink(
  url: string,
  contexto: string,
  serie: string,
  heroiId: string
): Promise<string | null>
```

Chama Gemini com a URL + pergunta/contexto do aluno + série + herói ativo. Retorna string formatada diretamente como KB — sem estrutura de blocos (mais simples que `gerarAcervo`).

**Output format:**
```
CONTEÚDO DO LINK: [url]
TEMA CENTRAL: [1 frase]
RESUMO: [3-5 parágrafos do conteúdo principal adaptado para a série]
CONCEITOS-CHAVE: [termos importantes]
INTENÇÃO DO ALUNO: [o que o aluno pediu / o que deve ser estudado]
```

**Fail-silently:** se Gemini falhar, URL inacessível ou JSON inválido → retorna `null`. Herói responde sem KB (degradação graciosa, sem erro visível ao aluno). Log em `console.error` para debugging.

**Bloqueante:** sim. `await investigarLink(...)` — a resposta do herói depende do conteúdo do link.

---

### 3. DB — coluna `link_pendente`

**Tabela:** `b2c_sessoes`  
**Coluna:** `link_pendente TEXT NULL DEFAULT NULL`

Migration SQL:
```sql
ALTER TABLE b2c_sessoes ADD COLUMN IF NOT EXISTS link_pendente TEXT DEFAULT NULL;
```

**Interface TypeScript** — `server/src/db/supabase.ts`, interface `Sessao`:
```typescript
link_pendente: string | null  // ← adicionar
```

**Função `atualizarSessao()`** — `server/src/db/persistence.ts`, adicionar ao tipo de `updates`:
```typescript
link_pendente?: string | null  // ← adicionar
```

---

## Lógica completa em `message.ts`

Inserir após `if (nova_sessao === true) { await resetarSessaoAgente(sessao.id) }`, antes de `decidirPersona()`:

```typescript
// ── HOOK 0 — LINK GUARDIAN ──────────────────────────────────────────────────
import { detectarURL } from '../utils/detect-url.js'
import { investigarLink } from '../super-prova/investigar-link.js'

const linkDetectado = detectarURL(mensagem)
const linkParaInvestigar = linkDetectado?.url ?? sessao.link_pendente ?? null
const temContextoLink   = linkDetectado?.temContexto || !!sessao.link_pendente

if (linkParaInvestigar && !temContextoLink) {
  // Sem contexto → pedir explicação, salvar link, encerrar
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
  // Com contexto (ou link pendente + contexto novo) → Super Prova investiga
  enviarEvento('search', { texto: '🔍 analisando conteúdo do link...' })
  const kbLink = await investigarLink(
    linkParaInvestigar,
    mensagem,
    aluno.serie ?? '7ano',
    sessao.agente_atual ?? 'GAIA'
  ).catch(() => null)
  if (kbLink) {
    await persistirKnowledgeBase(sessao.id, kbLink).catch(() => {})
  }
  await atualizarSessao(sessao.id, { link_pendente: null })
  // ← continua para decidirPersona() normalmente
}
// ── FIM HOOK 0 ────────────────────────────────────────────────────────────────
```

---

## O que NÃO muda

- Todo o fluxo `PSICO → Herói → SSE stream → persist` permanece intacto
- Os 3 Hooks existentes do Super Prova (1, 2, 3) não são tocados
- Frontend não precisa de mudança — evento `'search'` já é tratado pelo `chat.ts`
- Nenhuma mudança nos prompts dos heróis

---

## Arquivos afetados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `server/src/utils/detect-url.ts` | **Novo** | `detectarURL()` — função pura, ~10 linhas |
| `server/src/super-prova/investigar-link.ts` | **Novo** | `investigarLink()` — Gemini lê URL, fail-silently |
| `server/src/routes/message.ts` | Modificado | Hook 0 inserido após reset nova_sessao, antes de decidirPersona |
| `server/src/db/supabase.ts` | Modificado | Interface `Sessao` ganha `link_pendente: string \| null` |
| `server/src/db/persistence.ts` | Modificado | `atualizarSessao()` aceita `link_pendente?: string \| null` |
| Migration SQL Supabase | **Novo** | `ALTER TABLE b2c_sessoes ADD COLUMN link_pendente TEXT` |

---

## Critérios de sucesso

- Aluno manda `https://link.com/quilombos` sem texto → recebe pergunta de contexto, link salvo em `link_pendente`
- Aluno responde com qualquer explicação (1 frase ou 10) → sistema usa link salvo + contexto → Gemini investiga → KB injetado → herói responde com conhecimento do link → `link_pendente` limpo
- Aluno manda `"sobre quilombos modernos https://link.com"` → Gemini investiga direto, sem pedir contexto
- `www.historia.com`, `v1.0.3`, frases com pontos → `detectarURL` retorna `null`, fluxo normal
- Aluno atinge limite de uso com link pendente → limite é verificado antes do Hook 0, aluno vê mensagem de limite normal
- Falha do Gemini → herói responde sem KB, `link_pendente` limpo, sem erro visível ao aluno
- TypeCheck: 0 erros server + web
