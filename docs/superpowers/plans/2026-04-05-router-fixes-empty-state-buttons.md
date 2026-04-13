# Router Fixes + EmptyState Buttons Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o bug de perda de contexto quando aluno responde com texto curto (ex: "2"), e transformar os pseudo-botões de matéria no EmptyState em botões reais com fluxo storytelling.

**Architecture:** Três correções no roteador backend (router.ts + prompt PSICO) eliminam o bug onde `null` do LLM não acionava o guard de stickiness, causando PSICO responder no lugar do herói ativo. No frontend, botões de matéria ganham interatividade real: ao clicar, disparam `enviar('Ativar Matemática')` (fluxo PSICO cascade existente) com uma mensagem narrativa de carregamento após 400ms.

**Tech Stack:** TypeScript (Express backend), React + Vite (frontend), Supabase (contexto), Railway deploy. Escape Hatch para git push (sem git no VM).

---

## Contexto Crítico

- **Bug raiz:** `classificarTema()` tem timeout de 500ms. Quando estoura, retorna `null`. O guard de stickiness na linha 575 do router.ts só checa `=== 'indefinido'`, deixando `null` escapar para PSICOPEDAGOGICO.
- **Fix 1:** Condição passa a checar `!temaLLM || temaLLM === 'indefinido'`.
- **Fix 2 (prevenção):** Quando herói ativo + sem keywords na mensagem → skip LLM inteiramente, continuidade direta. Resolve a classe de problemas na raiz.
- **Fix 3 (PSICO prompt):** PSICO recebe instrução explícita de reconhecer "resposta curta após exercício" como continuidade, não como nova qualificação.
- **isFirstMessageRef:** `limpar()` já reseta para `true` (ChatContext.tsx linha 129). SlideMenu já chama `limpar()` ao navegar. Nenhuma alteração necessária nesses arquivos.
- **Header:** Não alterar lógica de `heroiAtivo`. CALCULUS dispara `onAgente` normalmente via cascade.

---

## File Structure

### Modificar

| Arquivo | O que muda |
|---------|-----------|
| `server/src/core/router.ts` | Fix 1 (linha 575) + Fix 2 (novo bloco após linha 564) |
| `server/src/personas/PSICOPEDAGOGICO.md` | Fix 3: nova seção ao final do arquivo |
| `Prompts/PSICOPEDAGOGICO.md` | Fix 3: mesma seção ao final |
| `web/src/components/EmptyState.tsx` | Botões reais + textos atualizados + handler de clique |

### Não modificar (verificado)

| Arquivo | Motivo |
|---------|--------|
| `web/src/contexts/ChatContext.tsx` | `limpar()` já reseta `isFirstMessageRef.current = true` (linha 129) ✅ |
| `web/src/components/SlideMenu.tsx` | Já chama `limpar()` em toda navegação ✅ |
| `web/src/pages/ChatPage.tsx` | Sem alterações ✅ |
| `web/src/components/ChatMessages.tsx` | Sem alterações ✅ |

---

## Chunk 1: Backend — Correções no Roteador

### Task 1: Fix 1 — Stickiness guard: `null` não ativa continuidade

**Arquivo:** `server/src/core/router.ts`, linhas ~575

**O bug exato:**
```typescript
// ANTES (linha 575) — null cai fora do if, vai para PSICOPEDAGOGICO
if (temaLLM === 'indefinido') {
  if (sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
    console.log(`➡️ Continuidade (classificador indefinido): ${sessao.agente_atual}`)
    return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
  }
}
```

- [ ] **Step 1.1: Aplicar Fix 1**

  Localizar o bloco exato em `server/src/core/router.ts`:
  ```typescript
  if (temaLLM === 'indefinido') {
    // 4b. Indefinido — continuidade se agente ativo
    if (sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      console.log(`➡️ Continuidade (classificador indefinido): ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }
  }
  ```

  Substituir por:
  ```typescript
  if (!temaLLM || temaLLM === 'indefinido') {
    // 4b. Indefinido ou timeout (null) — continuidade se agente ativo
    if (sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      console.log(`➡️ Continuidade (classificador ${temaLLM ?? 'null/timeout'}): ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }
  }
  ```

- [ ] **Step 1.2: Verificar TypeScript**

  ```bash
  cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit
  ```
  Esperado: 0 erros.

---

### Task 2: Fix 2 — Skip LLM quando herói ativo + sem keywords

**Arquivo:** `server/src/core/router.ts`, inserir após linha ~564 (após o bloco `if (temaKeywords)` de rota normal)

**Contexto — estrutura atual (linhas 562-584):**
```typescript
  if (temaKeywords) {
    // 3. Tema detectado por keywords → fluxo normal (sem herói ativo ou mesmo tema)
    return decidirComTema(temaKeywords, sessao, ultimosTurnos)
  }

  // 4. Keywords falharam → classificador LLM (SEMPRE)
  const temaLLM = await classificarTema(mensagem)
  ...
```

- [ ] **Step 2.1: Inserir bloco de continuidade direta**

  Localizar o comentário exato:
  ```typescript
    // 4. Keywords falharam → classificador LLM (SEMPRE)
    const temaLLM = await classificarTema(mensagem)
  ```

  Substituir por:
  ```typescript
    // 3b. Sem keywords E herói ativo → skip LLM, continuidade direta
    // Caso típico: resposta curta do aluno ("2", "sim", "letra c") sem palavra-chave de matéria.
    if (!temaKeywords && sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      console.log(`➡️ Continuidade (sem keywords, herói ativo): ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }

    // 4. Keywords falharam → classificador LLM (SEMPRE)
    const temaLLM = await classificarTema(mensagem)
  ```

- [ ] **Step 2.2: Verificar TypeScript**

  ```bash
  cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit
  ```
  Esperado: 0 erros.

---

### Task 3: Fix 3 — PSICO: detectar continuidade por resposta curta

**Arquivos:** `server/src/personas/PSICOPEDAGOGICO.md` e `Prompts/PSICOPEDAGOGICO.md`

A seção abaixo deve ser **acrescentada ao final** de ambos os arquivos (sem modificar o conteúdo existente).

- [ ] **Step 3.1: Acrescentar seção em `server/src/personas/PSICOPEDAGOGICO.md`**

  Adicionar ao final do arquivo (após a última linha existente):

  ```markdown

  ══════════════════════════════════════════════════════════════
  DETECÇÃO DE CONTINUIDADE — RESPOSTA CURTA APÓS EXERCÍCIO
  ══════════════════════════════════════════════════════════════

  REGRA: Se o turno anterior foi de um herói (CALCULUS, VERBETTA, VECTOR, GAIA, TEMPUS, FLEX, ALKA ou NEURON) fazendo uma pergunta, propondo um exercício ou aguardando resposta, E a mensagem atual do aluno é curta (1 a 5 palavras, um número, uma frase de resposta direta como "2", "sim", "não sei", "oito", "letra c"), então:

  1. Classifique como CONTINUIDADE da matéria anterior.
  2. Use ENCAMINHAR_PARA_HEROI com o mesmo herói do turno anterior.
  3. NÃO responda ao aluno diretamente.
  4. NÃO inicie novo processo de qualificação.
  5. Passe no plano pedagógico: objetivo_da_interacao: "continuidade — aluno respondeu exercício ou pergunta do herói, avaliar resposta e seguir didática".

  COMO DETECTAR O HERÓI ANTERIOR:
  Ao carregar CARREGAR_MEMORIA_CONVERSA, os últimos turnos incluem o campo "agente" de cada mensagem.
  Se o último turno tem agente = CALCULUS (ou outro herói), esse é o contexto ativo.
  Use essa informação para encaminhar ao herói correto na continuidade.

  SINAIS DE CONTINUIDADE:
  - Último turno foi de um herói (campo "agente" ≠ "PSICOPEDAGOGICO")
  - Mensagem atual: 1 a 5 palavras, número, letra, palavra de confirmação/negação

  EXEMPLO CORRETO:
  - Último turno: CALCULUS perguntou "Quanto é 15 dividido por 3?"
  - Mensagem atual: "5" ou "acho que é 5" ou "não sei"
  → ENCAMINHAR_PARA_HEROI: CALCULUS, objetivo: "continuidade — aluno respondeu exercício"

  ANTI-PADRÃO PROIBIDO:
  NÃO responder "Boa resposta!" ou "Vamos continuar..." ou qualquer coisa ao aluno.
  O herói é o ÚNICO autorizado a dar feedback pedagógico sobre exercícios e respostas.
  Você, PSICOPEDAGOGICO, NÃO interfere no fluxo pedagógico quando o contexto é continuidade.
  ```

- [ ] **Step 3.2: Acrescentar mesma seção em `Prompts/PSICOPEDAGOGICO.md`**

  Adicionar exatamente o mesmo bloco ao final de `Prompts/PSICOPEDAGOGICO.md` (após a última linha existente — que termina com o JSON de `ENCAMINHAR_PARA_HUMANO`).

- [ ] **Step 3.3: Verificar que conteúdo existente não foi alterado**

  Verificar que as primeiras linhas de ambos os arquivos permanecem idênticas ao original. O único conteúdo novo deve ser a seção acrescentada ao final.

---

### Task 4: Commit Chunk 1 via Escape Hatch

- [ ] **Step 4.1: Montar prompt Escape Hatch para o Leon**

  > ⚠️ Git não pode ser executado no VM. Leon deve rodar este prompt no Claude Code CLI local.

  ```
  Execute no terminal local (C:\Users\Leon\Desktop\SuperAgentes_B2C_V2):

  cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
  git add server/src/core/router.ts server/src/personas/PSICOPEDAGOGICO.md Prompts/PSICOPEDAGOGICO.md
  git commit -m "fix: router null-stickiness + skip LLM com herói ativo + PSICO continuidade"
  git push origin main

  Não pergunte nada, execute tudo e mostre o resultado de cada passo.
  ```

---

## Chunk 2: Frontend — EmptyState Botões Reais

### Task 5: Atualizar `web/src/components/EmptyState.tsx`

Três mudanças neste arquivo:
1. Textos de convite (CTA) atualizados para convidar ambos os caminhos (digitar OU clicar)
2. `MATERIA_CONFIG` com mapeamento matéria → mensagem + nome do herói
3. `<div>` de matérias vira `<button>` real com estilo âmbar + handler de clique storytelling

**Arquivo completo após as alterações:**

```tsx
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

interface EmptyContent {
  titulo: string
  subtitulo: string
  cta: string
}

// Textos para MODO FILHO
const EMPTY_FILHO: Record<string, EmptyContent> = {
  super_agentes: {
    titulo: 'Oi, {nome}!',
    subtitulo: 'Tenho 8 professores prontos para te ajudar.',
    cta: 'Pode digitar sua dúvida aqui embaixo, ou toca numa matéria para começar.',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar inteligência artificial como ferramenta de estudo.',
    cta: 'Me diga o que você quer fazer e eu te ensino a promptar!',
  },
}

// Textos para MODO PAI
const EMPTY_PAI: Record<string, EmptyContent> = {
  super_agentes: {
    titulo: 'Olá, {nome}!',
    subtitulo: 'Posso te ajudar a ensinar qualquer matéria para seu filho.',
    cta: 'Pode digitar uma dúvida ou escolha a matéria diretamente.',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar IA enquanto te ajudo a promptar.',
    cta: 'Me conte o que quer aprender e vamos juntos!',
  },
  supervisor: {
    titulo: 'Supervisor Educacional',
    subtitulo: 'Acompanhe o desenvolvimento do seu filho nos estudos.',
    cta: 'Pergunte sobre o progresso da semana ou peça um resumo!',
  },
}

// Mapeamento matéria → mensagem enviada ao backend + nome do herói (para storytelling)
const MATERIA_CONFIG: Record<string, { mensagem: string; heroNome: string }> = {
  'Matemática': { mensagem: 'Ativar Matemática',  heroNome: 'Cálculus' },
  'Português':  { mensagem: 'Ativar Português',   heroNome: 'Verbetta' },
  'Ciências':   { mensagem: 'Ativar Ciências',    heroNome: 'Neuron'   },
  'História':   { mensagem: 'Ativar História',    heroNome: 'Tempus'   },
  'Geografia':  { mensagem: 'Ativar Geografia',   heroNome: 'Gaia'     },
  'Física':     { mensagem: 'Ativar Física',      heroNome: 'Vector'   },
  'Química':    { mensagem: 'Ativar Química',     heroNome: 'Alka'     },
  'Idiomas':    { mensagem: 'Ativar Idiomas',     heroNome: 'Flex'     },
}

const MATERIAS = Object.keys(MATERIA_CONFIG)

export function EmptyState() {
  const { perfilAtivo } = useAuth()
  const { agenteMenu, heroiAtivo, enviar } = useChat()
  const nome = perfilAtivo?.nome || 'aluno'
  const isPai = perfilAtivo?.tipoUsuario === 'pai'

  const conteudos = isPai ? EMPTY_PAI : EMPTY_FILHO
  const content = conteudos[agenteMenu] || conteudos['super_agentes']

  // Get hero data if active
  const heroData = heroiAtivo ? HEROES[heroiAtivo as HeroId] : null
  const avatarSrc = heroData?.avatar || '/logo-buble.png'
  const accentColor = heroData?.accent || '#3B6BA8'

  const handleMateriaClick = (materia: string) => {
    const config = MATERIA_CONFIG[materia]
    if (!config) return

    // Disparar envio → adiciona user bubble + seta streaming=true → TypingDots automáticos
    void enviar(config.mensagem)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Avatar container with glow background */}
      <div className="relative mb-5">
        {/* Subtle radial accent glow */}
        <div
          className="absolute w-24 h-24 rounded-full opacity-15 blur-2xl"
          style={{
            backgroundColor: accentColor,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Avatar background tint */}
        <div
          className="absolute inset-0 rounded-[26px]"
          style={{ backgroundColor: `${accentColor}20` }}
        />

        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt="Avatar"
          className="relative w-[88px] h-[88px] rounded-[26px] object-cover shadow-lg"
        />
      </div>

      {/* Greeting */}
      <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
        {content.titulo.replace('{nome}', nome)}
      </h2>

      {/* Description */}
      <p className="text-[14.5px] text-[var(--text-secondary)] max-w-[280px] mb-1">
        {content.subtitulo}
      </p>

      {/* CTA */}
      <p className="text-xs text-[var(--text-muted)] max-w-[280px] italic mb-6">
        {content.cta}
      </p>

      {/* Subject buttons — only when agenteMenu === 'super_agentes' */}
      {agenteMenu === 'super_agentes' && (
        <div className="flex flex-wrap justify-center gap-3 max-w-[340px]">
          {MATERIAS.map((materia) => (
            <button
              key={materia}
              onClick={() => handleMateriaClick(materia)}
              className="px-5 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                color: '#92400E',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              {materia}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5.1: Verificar que `enviar` está exportado pelo ChatContext**

  Confirmar que `ChatContextValue` inclui `enviar` (ChatContext.tsx linha 19). ✅ Já confirmado. `addMessage` não é mais necessário no EmptyState.

- [ ] **Step 5.2: Substituir conteúdo de `web/src/components/EmptyState.tsx`**

  Usar o arquivo completo acima. O arquivo existente tem 132 linhas — substituir integralmente.

- [ ] **Step 5.3: Verificar TypeScript do frontend**

  ```bash
  cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit
  ```
  Esperado: 0 erros.

- [ ] **Step 5.4: Verificar comportamento esperado no código**

  Confirmar manualmente no arquivo salvo:
  - `<button>` com `onClick={() => handleMateriaClick(materia)}` ✅
  - `enviar(config.mensagem)` chamado ✅
  - Sem setTimeout (TypingDots automáticos via `streaming=true`) ✅
  - `MATERIA_CONFIG` com todos os 8 heróis ✅
  - CTA filho: "Pode digitar sua dúvida aqui embaixo, ou toca numa matéria para começar." ✅
  - CTA pai: "Pode digitar uma dúvida ou escolha a matéria diretamente." ✅

---

### Task 6: Commit Chunk 2 via Escape Hatch

- [ ] **Step 6.1: Montar prompt Escape Hatch para o Leon**

  > ⚠️ Git não pode ser executado no VM. Leon deve rodar este prompt no Claude Code CLI local.

  ```
  Execute no terminal local (C:\Users\Leon\Desktop\SuperAgentes_B2C_V2):

  cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
  git add web/src/components/EmptyState.tsx
  git commit -m "feat: EmptyState botões de matéria reais com storytelling e textos atualizados"
  git push origin main

  Não pergunte nada, execute tudo e mostre o resultado de cada passo.
  ```

---

## Checklist de QA Pós-Deploy

> Após deploy Railway (~3 min), testar com a conta `leon@pense-ai.com` / senha `3282`

### QA 1 — Bug de perda de contexto (Fix 1 + Fix 2)

**Setup:** Entrar como Layla, abrir Matemática, esperar CALCULUS carregar e fazer uma pergunta ou exercício.

| # | Input do aluno | Esperado | Proibido |
|---|---------------|----------|---------|
| 1a | Resposta curta: "5" | CALCULUS continua, dá feedback sobre a resposta | PSICO aparecer, qualificação nova |
| 1b | Resposta numérica: "3,14" | CALCULUS continua | Qualquer output do PSICO visível ao aluno |
| 1c | Resposta vaga: "não sei" | CALCULUS reencaminha/explica novamente | PSICO re-qualificar matéria |

**Sinal de aprovação:** Transcrição mostra CALCULUS respondendo diretamente à resposta do aluno.

---

### QA 2 — EmptyState botões clicáveis

**Setup:** Entrar como Layla, tela de EmptyState visível.

| # | Ação | Esperado | Proibido |
|---|------|----------|---------|
| 2a | Visual: botões na tela | Fundo amarelo/âmbar, borda dourada, texto marrom escuro, maiores que antes | Estilo cinza/branco original |
| 2b | Clicar "Matemática" | User bubble "Ativar Matemática" aparece imediatamente + TypingDots ativos | EmptyState permanece visível |
| 2c | 2-5s após clique | CALCULUS abre com saudação/pergunta em Matemática | PSICO aparecendo e pedindo qualificação |
| 2d | Header após carregamento | Header muda para CALCULUS | Header genérico permanece |
| 2e | Clicar "Português" | Mesma sequência, Verbetta responde | — |
| 2f | Menu lateral → Super Agentes → clicar "Geografia" | GAIA carrega como nova sessão | Contexto de Matemática vaza |

**Sinal de aprovação:** Transcrição mostra: [user] "Ativar Matemática" → [CALCULUS] saudação/pergunta inicial sobre Matemática. TypingDots visíveis enquanto aguarda.

---

### QA 3 — SlideMenu → EmptyState (regressão)

**Setup:** Já em conversa com CALCULUS, clicar "Super Agentes" no menu lateral.

| # | Ação | Esperado | Proibido |
|---|------|----------|---------|
| 3a | Clicar menu "Super Agentes" | Chat limpa, EmptyState reaparece com botões | Conversa anterior persiste |
| 3b | Clicar "Geografia" no EmptyState | GAIA carrega normalmente | Contexto da sessão anterior vaza |

**Sinal de aprovação:** EmptyState visível após limpar, GAIA responde como nova sessão.

---

## Pushes Pendentes do Dia Anterior

> Antes de executar este plano, verificar se os 2 pushes da sessão de 2026-04-04 já foram feitos.
> Ver `docs/MEMORIA_CURTA.md` seção "DOIS PUSHES PENDENTES — ESCAPE HATCH".

Se NÃO foram feitos, executar PRIMEIRO via Escape Hatch:

**Push 1 — BUG-57:**
```
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/core/router.ts
git commit -m "fix: BUG-57 stickiness bypass usa keywords como fallback quando LLM retorna indefinido"
git push origin main
```

**Push 2 — MODO PAI dois estados:**
```
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/core/context.ts server/src/personas/VERBETTA.md server/src/personas/CALCULUS.md server/src/personas/NEURON.md server/src/personas/TEMPUS.md server/src/personas/GAIA.md server/src/personas/VECTOR.md server/src/personas/ALKA.md server/src/personas/FLEX.md Prompts/VERBETTA.md Prompts/CALCULUS.md Prompts/NEURON.md Prompts/TEMPUS.md Prompts/GAIA.md Prompts/VECTOR.md Prompts/ALKA.md Prompts/FLEX.md CLAUDE.md
git commit -m "fix: MODO PAI dois estados — herói pergunta antes de ensinar na primeira interação"
git push origin main
```
