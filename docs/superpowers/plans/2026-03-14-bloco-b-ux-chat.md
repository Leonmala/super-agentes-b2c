# Bloco B — UX de Chat (Polimento Pré-Venda)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a experiência visual do chat com balões por frase, typing mais lento, nome do usuário no menu e textos de convite dinâmicos por agente.

**Architecture:** Todas as mudanças são puramente frontend — nenhuma alteração no backend. O split por frases é visual (no render, não nos dados). O typing effect ajusta constantes. O menu e EmptyState recebem estado do agente selecionado via ChatContext.

**Tech Stack:** React 18, Tailwind CSS, TypeScript

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `web/src/components/ChatBubble.tsx` | Modificar | Split visual: cada frase do agente em balão separado |
| `web/src/hooks/useTypingEffect.ts` | Modificar (constantes) | Reduzir velocidade de revelação |
| `web/src/components/SlideMenu.tsx` | Modificar | Adicionar nome do usuário logado no topo + agente selecionado |
| `web/src/components/EmptyState.tsx` | Modificar | Texto dinâmico por agente selecionado (Super Agentes / Professor IA / Supervisor) |
| `web/src/contexts/ChatContext.tsx` | Modificar | Adicionar `agenteMenu` state para rastrear agente selecionado no menu |

---

## Chunk 1: UX Improvements

### Task 1: Typing Effect Mais Lento

**Problema:** O typing está rápido demais (3 chars/25ms = ~120 chars/s). Leon quer mais lento, com sensação mais humana.

**Solução:** Ajustar constantes: CHARS_PER_TICK 3→2, TICK_INTERVAL_MS 25→35, PARAGRAPH_PAUSE_MS 400→800, FLUSH_CHARS_PER_TICK 15→8.

**Files:**
- Modify: `web/src/hooks/useTypingEffect.ts:16-19`

- [ ] **Step 1: Ajustar constantes de velocidade**

Mudar as 4 constantes no topo do arquivo:

```typescript
const CHARS_PER_TICK = 2
const TICK_INTERVAL_MS = 35
const PARAGRAPH_PAUSE_MS = 800
const FLUSH_CHARS_PER_TICK = 8
```

Resultado: ~57 chars/s normal (era ~120), pausa entre parágrafos dobrada, flush mais suave.

- [ ] **Step 2: Verificar compilação**

Run: `cd web && npx tsc --noEmit`

---

### Task 2: Sentence-Per-Bubble (Split Visual)

**Problema:** Blocos de texto enormes num único balão. Leon quer cada frase em balão separado.

**Solução:** No `ChatBubble`, quando `role === 'agent'` e NÃO está em streaming, splittar `content` por frases e renderizar cada uma como um sub-balão. O avatar aparece só no primeiro balão; os demais ficam com margem alinhada.

**Regras de split:**
- Separar por `.` `!` `?` seguidos de espaço ou fim de string
- Manter emojis colados na frase anterior
- Agrupar frases muito curtas (<20 chars) com a anterior
- Durante streaming, renderizar como balão único (o split acontece só no render final)

**Files:**
- Modify: `web/src/components/ChatBubble.tsx`

- [ ] **Step 1: Criar função splitSentences**

Adicionar no topo do arquivo, antes do componente:

```typescript
/** Separa texto em frases para renderizar como balões individuais */
function splitSentences(text: string): string[] {
  // Split por pontuação final seguida de espaço ou fim
  const raw = text.split(/(?<=[.!?])\s+/)
  if (raw.length <= 1) return [text]

  // Agrupar frases muito curtas (<20 chars) com a anterior
  const result: string[] = []
  for (const frase of raw) {
    const trimmed = frase.trim()
    if (!trimmed) continue
    if (result.length > 0 && trimmed.length < 20) {
      result[result.length - 1] += ' ' + trimmed
    } else {
      result.push(trimmed)
    }
  }
  return result.length > 0 ? result : [text]
}
```

- [ ] **Step 2: Refatorar ChatBubble para renderizar multi-balão**

O componente de agente (não-user) precisa:
1. Se `isStreaming` → renderizar balão único (comportamento atual)
2. Se NOT streaming → splittar em frases → renderizar cada frase como sub-balão
3. Avatar aparece só no primeiro balão
4. Sub-balões têm `ml-10` (alinhado com o primeiro, após avatar w-8 + gap-2)

```tsx
  // Bloco de agente multi-balão
  const sentences = isStreaming ? [content] : splitSentences(content)

  return (
    <div className="mb-3">
      {sentences.map((frase, i) => (
        <div key={i} className={`flex gap-2 items-start ${i > 0 ? 'mt-1.5 ml-10' : ''}`}>
          {i === 0 && (
            hero ? (
              <img src={hero.avatar} alt={hero.nome}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <img src="/logo-buble.png" alt="Super Agentes" className="w-8 h-8 rounded-full object-cover shrink-0" />
            )
          )}
          <div
            className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm chat-bubble-content"
            style={{ backgroundColor: bubbleBg, borderWidth: '1px', borderColor: bubbleBorder }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={ALLOWED_ELEMENTS}>
              {frase}
            </ReactMarkdown>
            {isStreaming && i === sentences.length - 1 && <StreamingCursor color={corHeroi} />}
          </div>
        </div>
      ))}
    </div>
  )
```

- [ ] **Step 3: Verificar compilação**

Run: `cd web && npx tsc --noEmit`

---

### Task 3: Nome do Usuário no Topo do SlideMenu

**Problema:** Usuário não sabe qual perfil está ativo. Leon quer o nome visível no topo do menu.

**Solução:** Após o logo e antes dos menu items, adicionar nome + tipo de perfil (ex: "Layla" ou "Leon — Modo Pai").

**Files:**
- Modify: `web/src/components/SlideMenu.tsx`

- [ ] **Step 1: Adicionar bloco de nome do usuário**

Após o header (logo + botão X) e antes do `<nav>`, adicionar:

```tsx
          {/* Nome do perfil ativo */}
          {perfilAtivo && (
            <div className="px-4 pb-3">
              <div className="bg-white/20 rounded-xl px-4 py-2.5">
                <p className="text-white font-semibold text-sm">{perfilAtivo.nome}</p>
                <p className="text-white/70 text-xs">
                  {isPai ? 'Responsável' : `Aluno${perfilAtivo.tipoInterface === 'medio' ? ' — Ensino Médio' : ''}`}
                </p>
              </div>
            </div>
          )}
```

- [ ] **Step 2: Verificar compilação**

Run: `cd web && npx tsc --noEmit`

---

### Task 4: EmptyState Dinâmico por Agente + Estado de Agente no Menu

**Problema:** O EmptyState mostra sempre o mesmo texto genérico, independente do agente selecionado no menu (Super Agentes vs Professor IA vs Supervisor). Leon quer textos de convite diferentes com call-to-action.

**Solução em 2 partes:**
1. ChatContext ganha `agenteMenu` state (qual agente está selecionado no menu lateral)
2. SlideMenu atualiza `agenteMenu` ao clicar nos itens + limpa mensagens
3. EmptyState lê `agenteMenu` e mostra texto personalizado

**Files:**
- Modify: `web/src/contexts/ChatContext.tsx`
- Modify: `web/src/components/SlideMenu.tsx`
- Modify: `web/src/components/EmptyState.tsx`

- [ ] **Step 1: Adicionar agenteMenu ao ChatContext**

Em ChatContext.tsx, adicionar state `agenteMenu` e setter:

```typescript
// Na interface ChatContextValue, adicionar:
  agenteMenu: string
  setAgenteMenu: (agente: string) => void

// No ChatProvider, adicionar:
  const [agenteMenu, setAgenteMenu] = useState<string>('super_agentes')

// No value do Provider, adicionar:
  agenteMenu, setAgenteMenu,
```

- [ ] **Step 2: SlideMenu atualiza agenteMenu ao clicar**

Em SlideMenu.tsx, importar `useChat` e atualizar os menuItems para ter um handler:

```typescript
  const menuItems = [
    { label: 'Super Agentes', icon: BookOpen, visible: true, agente: 'super_agentes' },
    { label: 'Professor de IA', icon: Bot, visible: showProfessorIA, agente: 'professor_ia' },
    { label: 'Supervisor', icon: Eye, visible: isPai, agente: 'supervisor' },
  ].filter(item => item.visible)
```

Cada botão chama:
```typescript
  onClick={() => {
    limpar()
    setAgenteMenu(item.agente)
    onClose()
  }}
```

Adicionar indicação visual do agente ativo (borda ou fundo mais forte).

- [ ] **Step 3: EmptyState com textos dinâmicos por agente**

Substituir conteúdo fixo por conteúdos baseados em `agenteMenu`:

```typescript
const EMPTY_STATE_CONTENT: Record<string, { titulo: string; subtitulo: string; cta: string }> = {
  super_agentes: {
    titulo: 'Olá, {nome}!',
    subtitulo: 'Tenho 8 professores prontos para te ajudar.',
    cta: 'Sobre qual matéria você quer estudar hoje? É só perguntar!',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar inteligência artificial como ferramenta de estudo.',
    cta: 'Me diga o que você quer fazer e eu te ensino a promptar!',
  },
  supervisor: {
    titulo: 'Supervisor Educacional',
    subtitulo: 'Acompanhe o desenvolvimento do seu filho nos estudos.',
    cta: 'Pergunte sobre o progresso da semana ou peça um resumo!',
  },
}

// Variantes para MODO PAI no super_agentes:
const EMPTY_STATE_PAI: Record<string, { titulo: string; subtitulo: string; cta: string }> = {
  super_agentes: {
    titulo: 'Olá, {nome}!',
    subtitulo: 'Posso te ajudar a ensinar qualquer matéria para seu filho.',
    cta: 'Qual matéria você quer trabalhar com seu filho hoje?',
  },
}
```

O componente decide qual conteúdo mostrar baseado em `agenteMenu` + `tipoUsuario`.

- [ ] **Step 4: Verificar compilação**

Run: `cd web && npx tsc --noEmit`

---

## Verificação Final

- [ ] **Build completo do projeto**

```bash
cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2
npm run build
```
Expected: Build sem erros

- [ ] **Atualizar docs de memória (Ralph Loop PERSIST)**

Atualizar MEMORIA_CURTA.md, CHECKLIST_PROJETO.md com Bloco B concluído.
