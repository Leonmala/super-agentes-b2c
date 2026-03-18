# PE1 — Botão "+" com Visão Multimodal

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o botão "+" funcional para envio de imagens, com visão multimodal real no LLM (herói vê a foto e responde sobre ela) e animação shimmer no balão enquanto processa.

**Architecture:** Base64 em JSON — frontend comprime a imagem via Canvas API, envia base64 no mesmo payload JSON existente; backend valida tamanho, repassa ao herói como array multimodal do Google Gemini SDK (`inlineData`); PSICO recebe apenas texto `"[foto anexada] ..."` sem a imagem. Fluxo texto-puro fica 100% intacto (path sem imagem não muda).

**Tech Stack:** TypeScript strict · Vite 6 + React 19 + Tailwind 4 · Express · `@google/generative-ai` (SDK nativo, NÃO OpenAI-compat) · CSS keyframes

---

> ⚠️ **NOTA CRÍTICA — formato LLM:**
> O `llm.ts` usa o SDK nativo `@google/generative-ai` — NÃO a API OpenAI-compatible.
> O formato multimodal correto é:
> ```ts
> parts: [
>   { inlineData: { mimeType: 'image/jpeg', data: base64SemPrefixo } },
>   { text: mensagemAluno }
> ]
> ```
> O spec menciona `image_url` (formato OpenAI) — **ignorar**, usar `inlineData` (SDK Google).

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `web/src/utils/image-compress.ts` | **CRIAR** | Utilitário Canvas: redimensiona + converte para base64 |
| `web/src/types.ts` | **MODIFICAR** linha 41 | Adicionar `imageUrl?` ao `ChatMessage` |
| `web/src/api/chat.ts` | **MODIFICAR** linhas 1-12 | Adicionar `imagemBase64?` em `SendMessageOptions` + body JSON |
| `web/src/contexts/ChatContext.tsx` | **MODIFICAR** linhas 16, 46, 52-58 | Expandir `enviar()` + criar `imageUrl` na msg do usuário |
| `web/src/components/ChatInput.tsx` | **MODIFICAR** inteiro | Input file oculto + preview thumbnail + envio com imagem |
| `web/src/index.css` | **MODIFICAR** | Adicionar keyframes `imageShimmer` + `badgePulse` |
| `web/src/components/ChatBubble.tsx` | **MODIFICAR** linhas 50-68 | Renderizar thumbnail + `ImageAnalysisOverlay` no balão user |
| `server/src/core/llm.ts` | **MODIFICAR** linhas 39-182 | `chamarLLM` + `chamarLLMStream` aceitam `imagemBase64?` + monta `inlineData` |
| `server/src/routes/message.ts` | **MODIFICAR** linhas 60-360 | Extrair + validar `imagem_base64` + passar para ambas as chamadas de herói |

---

## Chunk 1: Foundation + Frontend

### Task 1: Utilitário de compressão de imagem

**Files:**
- Create: `web/src/utils/image-compress.ts`

- [ ] **Step 1.1: Criar o arquivo utilitário**

```ts
// web/src/utils/image-compress.ts

export interface ImagemComprimida {
  base64: string        // sem prefixo data:...
  dataUrl: string       // com prefixo, para <img src>
  tamanhoKB: number
}

/**
 * Comprime um File de imagem via Canvas API.
 * Redimensiona para max maxPx em qualquer dimensão, exporta como JPEG.
 * Retorna base64 limpo (sem prefixo) + dataUrl completo + tamanho em KB.
 */
export async function comprimirImagem(
  file: File,
  maxPx = 1024,
  qualidade = 0.8
): Promise<ImagemComprimida> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo não é uma imagem'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height * maxPx) / width)
            width = maxPx
          } else {
            width = Math.round((width * maxPx) / height)
            height = maxPx
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas não suportado'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', qualidade)
        // Remover prefixo "data:image/jpeg;base64,"
        const base64 = dataUrl.split(',')[1]
        const tamanhoKB = Math.ceil((base64.length * 3) / 4 / 1024)

        resolve({ base64, dataUrl, tamanhoKB })
      }
      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 1.2: Verificar TypeScript no arquivo novo**

```bash
cd /caminho/SuperAgentes_B2C_V2/web && npx tsc --noEmit 2>&1 | head -20
```
Esperado: zero erros relacionados a `image-compress.ts`

---

### Task 2: Adicionar `imageUrl?` ao tipo `ChatMessage`

**Files:**
- Modify: `web/src/types.ts:41-47`

- [ ] **Step 2.1: Editar `ChatMessage`**

Localizar:
```ts
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  agente?: string
  timestamp: number
}
```

Substituir por:
```ts
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  agente?: string
  timestamp: number
  imageUrl?: string  // data URL local para exibição (não persistido)
}
```

- [ ] **Step 2.2: Verificar TypeScript**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```
Esperado: zero erros

---

### Task 3: Expandir contrato da API de chat

**Files:**
- Modify: `web/src/api/chat.ts:1-12` (interface) e `:24-30` (body JSON)

- [ ] **Step 3.1: Adicionar `imagemBase64?` na interface e no body**

Localizar `SendMessageOptions`:
```ts
export interface SendMessageOptions {
  alunoId: string
  mensagem: string
  tipoUsuario?: 'filho' | 'pai'
  agenteOverride?: string
  novaSessao?: boolean
  onAgente: (agente: string) => void
  onChunk: (texto: string) => void
  onDone: (data: Record<string, unknown>) => void
  onError: (erro: string) => void
  onLimite: (mensagem: string) => void
}
```

Substituir por:
```ts
export interface SendMessageOptions {
  alunoId: string
  mensagem: string
  tipoUsuario?: 'filho' | 'pai'
  agenteOverride?: string
  novaSessao?: boolean
  imagemBase64?: string
  onAgente: (agente: string) => void
  onChunk: (texto: string) => void
  onDone: (data: Record<string, unknown>) => void
  onError: (erro: string) => void
  onLimite: (mensagem: string) => void
}
```

Localizar o `JSON.stringify` do body:
```ts
    body: JSON.stringify({
      aluno_id: opts.alunoId,
      mensagem: opts.mensagem,
      tipo_usuario: opts.tipoUsuario || 'filho',
      agente_override: opts.agenteOverride,
      nova_sessao: opts.novaSessao || false,
    }),
```

Substituir por:
```ts
    body: JSON.stringify({
      aluno_id: opts.alunoId,
      mensagem: opts.mensagem,
      tipo_usuario: opts.tipoUsuario || 'filho',
      agente_override: opts.agenteOverride,
      nova_sessao: opts.novaSessao || false,
      ...(opts.imagemBase64 ? { imagem_base64: opts.imagemBase64 } : {}),
    }),
```

- [ ] **Step 3.2: TypeScript check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```
Esperado: zero erros

---

### Task 4: Expandir `enviar()` no ChatContext

**Files:**
- Modify: `web/src/contexts/ChatContext.tsx`

- [ ] **Step 4.1: Expandir interface e assinatura de `enviar`**

Localizar a linha na interface `ChatContextValue`:
```ts
  enviar: (texto: string, agenteOverride?: string) => Promise<void>
```
Substituir por:
```ts
  enviar: (texto: string, agenteOverride?: string, imagemBase64?: string) => Promise<void>
```

- [ ] **Step 4.2: Expandir a função `enviar` e construção da mensagem do usuário**

Localizar:
```ts
  const enviar = useCallback(async (texto: string, agenteOverride?: string) => {
```
Substituir por:
```ts
  const enviar = useCallback(async (texto: string, agenteOverride?: string, imagemBase64?: string) => {
```

Localizar o bloco que cria `userMsg`:
```ts
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
    }
```
Substituir por:
```ts
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
      imageUrl: imagemBase64 ? `data:image/jpeg;base64,${imagemBase64}` : undefined,
    }
```

- [ ] **Step 4.3: Passar `imagemBase64` para `sendMessage`**

Localizar:
```ts
    await sendMessage({
      alunoId: targetAlunoId,
      mensagem: texto,
      tipoUsuario: perfilAtivo.tipoUsuario,
      agenteOverride,
      novaSessao,
```
Substituir por:
```ts
    await sendMessage({
      alunoId: targetAlunoId,
      mensagem: texto,
      tipoUsuario: perfilAtivo.tipoUsuario,
      agenteOverride,
      novaSessao,
      imagemBase64,
```

- [ ] **Step 4.4: TypeScript check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```
Esperado: zero erros

---

### Task 5: Wiring do botão "+" no ChatInput

**Files:**
- Modify: `web/src/components/ChatInput.tsx` (reescrever inteiro — arquivo tem 96 linhas)

- [ ] **Step 5.1: Reescrever `ChatInput.tsx`**

```tsx
// web/src/components/ChatInput.tsx
import { useState, useRef, useEffect } from 'react'
import { Send, Plus, X } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'
import { comprimirImagem } from '../utils/image-compress'

interface ImagemPendente {
  base64: string
  preview: string  // dataUrl para <img src>
}

export function ChatInput() {
  const [texto, setTexto] = useState('')
  const [imagemPendente, setImagemPendente] = useState<ImagemPendente | null>(null)
  const [erroImagem, setErroImagem] = useState<string | null>(null)
  const { enviar, streaming, heroiAtivo } = useChat()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [texto])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!e.target.files) return
    // Limpar input para permitir reselecionar o mesmo arquivo
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErroImagem('Selecione apenas imagens')
      return
    }

    try {
      const comprimida = await comprimirImagem(file)
      if (comprimida.tamanhoKB > 500) {
        setErroImagem(`Imagem muito grande (${comprimida.tamanhoKB}KB). Tente outra.`)
        return
      }
      setImagemPendente({ base64: comprimida.base64, preview: comprimida.dataUrl })
      setErroImagem(null)
    } catch {
      setErroImagem('Erro ao processar imagem')
    }
  }

  const handleSubmit = () => {
    const trimmed = texto.trim()
    // Permitir envio só com imagem (sem texto)
    if ((!trimmed && !imagemPendente) || streaming) return
    enviar(trimmed, undefined, imagemPendente?.base64)
    setTexto('')
    setImagemPendente(null)
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getGradient = () => {
    if (heroiAtivo && HEROES[heroiAtivo as HeroId]) {
      const hero = HEROES[heroiAtivo as HeroId]
      return { from: hero.gradientFrom, to: hero.gradientTo }
    }
    return { from: '#2563EB', to: '#1E3A8A' }
  }

  const gradient = getGradient()

  return (
    <div className="px-3.5 py-2 pb-3.5 shrink-0">
      {/* Toast de erro de imagem */}
      {erroImagem && (
        <div className="max-w-2xl mx-auto mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-xs text-red-600">{erroImagem}</span>
          <button onClick={() => setErroImagem(null)} className="ml-2 text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Preview da imagem pendente */}
      {imagemPendente && (
        <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 px-1">
          <div className="relative">
            <img
              src={imagemPendente.preview}
              alt="Imagem a enviar"
              className="h-16 w-16 object-cover rounded-xl border border-gray-200"
            />
            <button
              onClick={() => setImagemPendente(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
              aria-label="Remover imagem"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Imagem selecionada</span>
        </div>
      )}

      <div
        className="flex items-end gap-2 bg-white rounded-[50px] p-1.5 pl-1.5 max-w-2xl mx-auto"
        style={{
          boxShadow: 'var(--shadow-float)',
          border: '1.5px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Botão "+" — abre file picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={streaming}
          className="w-10 h-10 rounded-full bg-[var(--bg-base)] text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors disabled:opacity-30"
          aria-label="Anexar imagem"
        >
          <Plus size={18} />
        </button>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua dúvida..."
          rows={1}
          className="flex-1 py-2.5 bg-transparent border-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none max-h-28"
        />

        {/* Botão enviar */}
        <button
          onClick={handleSubmit}
          disabled={(!texto.trim() && !imagemPendente) || streaming}
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-md hover:opacity-90 hover:scale-105 transition-all disabled:opacity-30"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: TypeScript check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -30
```
Esperado: zero erros

---

### Task 6: Animações CSS (shimmer + pulse)

**Files:**
- Modify: `web/src/index.css` — adicionar ao final do arquivo

- [ ] **Step 6.1: Adicionar keyframes ao final de `index.css`**

Adicionar ao final de `web/src/index.css`:
```css
/* ===== Animações de Análise de Imagem (PE1) ===== */

@keyframes imageShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.image-analysing-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: imageShimmer 1.6s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.65; transform: scale(0.95); }
}

.image-badge-pulse {
  animation: badgePulse 1.2s ease-in-out infinite;
}
```

---

### Task 7: Renderizar imagem + overlay de análise no ChatBubble

**Files:**
- Modify: `web/src/components/ChatBubble.tsx`

O `ChatBubble` precisa:
1. Receber `streaming` do contexto para saber se está analisando
2. Renderizar thumbnail se `message.imageUrl` presente
3. Mostrar overlay shimmer + badge enquanto `streaming && isLastUserMsg`

O `ChatBubble` atualmente não tem acesso ao estado `streaming`. A solução mais simples: a prop `singleBubble` não se aplica a mensagens do usuário; adicionar prop `isAnalysing?: boolean` ao componente.

- [ ] **Step 7.1: Atualizar `ChatBubble` para suportar imagem e animação**

Localizar a interface de props:
```ts
interface ChatBubbleProps {
  message: ChatMessage
  /** Se true, renderiza como balão único (sem split por frases, sem avatar) */
  singleBubble?: boolean
  /** Índice do balão na revelação (0 = primeiro, com avatar) */
  bubbleIndex?: number
}
```
Substituir por:
```ts
interface ChatBubbleProps {
  message: ChatMessage
  /** Se true, renderiza como balão único (sem split por frases, sem avatar) */
  singleBubble?: boolean
  /** Índice do balão na revelação (0 = primeiro, com avatar) */
  bubbleIndex?: number
  /** Se true, exibe overlay shimmer de análise (última mensagem do user durante streaming) */
  isAnalysing?: boolean
  /** Nome do herói para badge (ex: "CALCULUS") */
  nomeHeroi?: string
}
```

Localizar a função que recebe as props:
```ts
export function ChatBubble({ message, singleBubble, bubbleIndex }: ChatBubbleProps) {
```
Substituir por:
```ts
export function ChatBubble({ message, singleBubble, bubbleIndex, isAnalysing, nomeHeroi }: ChatBubbleProps) {
```

Localizar o bloco do usuário (começa em `if (isUser) {`):
```tsx
  if (isUser) {
    const gradientFrom = hero?.gradientFrom || profileColor
    const gradientTo = hero?.gradientTo || profileColor
    const userGradient = `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`

    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-3 text-sm text-white chat-bubble-content"
          style={{
            background: userGradient,
            borderRadius: '22px 6px 22px 22px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }
```
Substituir por:
```tsx
  if (isUser) {
    const gradientFrom = hero?.gradientFrom || profileColor
    const gradientTo = hero?.gradientTo || profileColor
    const userGradient = `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`

    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-3 text-sm text-white chat-bubble-content"
          style={{
            background: userGradient,
            borderRadius: '22px 6px 22px 22px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {/* Thumbnail da imagem (se houver) */}
          {message.imageUrl && (
            <div className="relative mb-2 inline-block">
              <img
                src={message.imageUrl}
                alt="Imagem enviada"
                className="rounded-xl block"
                style={{ maxWidth: '240px', maxHeight: '240px', objectFit: 'cover' }}
              />
              {/* Overlay shimmer enquanto herói analisa */}
              {isAnalysing && (
                <div
                  className="absolute inset-0 rounded-xl image-analysing-shimmer"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Badge pulsante */}
              {isAnalysing && (
                <div
                  className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 image-badge-pulse"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-white text-[10px] font-medium">
                    {nomeHeroi ? `${nomeHeroi} analisando...` : 'Analisando...'}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Texto (se houver) */}
          {message.content && <div>{message.content}</div>}
        </div>
      </div>
    )
  }
```

- [ ] **Step 7.2: TypeScript check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -30
```
Esperado: zero erros

---

### Task 8: Passar `isAnalysing` e `nomeHeroi` do ChatMessages

O `ChatMessages.tsx` renderiza os `ChatBubble`. É ele que tem acesso ao estado `streaming` (via `useChat`) e sabe qual é a última mensagem do usuário.

- [ ] **Step 8.1: Verificar ChatMessages.tsx atual**

```bash
cat web/src/components/ChatMessages.tsx
```

- [ ] **Step 8.2: Identificar onde `ChatBubble` é instanciado para mensagens do usuário e adicionar props**

No `ChatMessages.tsx`, encontrar as chamadas a `<ChatBubble>` para mensagens com `role === 'user'`.

Pré-calcular o índice da última mensagem do usuário **antes** do map (evitar recalcular por item):
```tsx
const ultimoIndexUser = mensagens.reduce((last, m, i) => m.role === 'user' ? i : last, -1)
```

Adicionar as props `isAnalysing` e `nomeHeroi`:
```tsx
// Dentro do map de mensagens:
<ChatBubble
  key={message.id}
  message={message}
  isAnalysing={streaming && !!message.imageUrl && i === ultimoIndexUser}
  nomeHeroi={heroiAtivo || undefined}
/>
```

- [ ] **Step 8.3: TypeScript check + commit parcial**

```bash
cd web && npx tsc --noEmit 2>&1 | head -30
```
Esperado: zero erros

```bash
cd ..  # volta para raiz do projeto
git add web/src/utils/image-compress.ts \
        web/src/types.ts \
        web/src/api/chat.ts \
        web/src/contexts/ChatContext.tsx \
        web/src/components/ChatInput.tsx \
        web/src/index.css \
        web/src/components/ChatBubble.tsx \
        web/src/components/ChatMessages.tsx
git commit -m "feat(pe1): frontend — compressão, tipos, API, input+preview, bubble shimmer"
```

---

## Chunk 2: Backend

### Task 9: Suporte multimodal em `llm.ts`

**Files:**
- Modify: `server/src/core/llm.ts`

> ⚠️ O projeto usa `@google/generative-ai` SDK nativo.
> Formato multimodal: `parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64SemPrefixo } }, { text: mensagem }]`

- [ ] **Step 9.1: Adicionar helper `montarPartsUsuario` no início de `llm.ts`**

Após os imports e antes da função `chamarLLM`, adicionar:

```ts
// Monta o array de parts para a mensagem do usuário.
// Se imagemBase64 presente: multimodal (inlineData + text).
// Caso contrário: apenas text (sem regressão).
function montarPartsUsuario(mensagem: string, imagemBase64?: string) {
  if (imagemBase64) {
    return [
      { inlineData: { mimeType: 'image/jpeg' as const, data: imagemBase64 } },
      { text: mensagem },
    ]
  }
  return [{ text: mensagem }]
}
```

- [ ] **Step 9.2: Adicionar `imagemBase64?` em `chamarLLM` e usar o helper**

Localizar a assinatura de `chamarLLM`:
```ts
export async function chamarLLM(
  systemPrompt: string,
  contexto: string,
  mensagemAluno: string,
  persona: string
): Promise<RespostaLLM> {
```
Substituir por:
```ts
export async function chamarLLM(
  systemPrompt: string,
  contexto: string,
  mensagemAluno: string,
  persona: string,
  imagemBase64?: string
): Promise<RespostaLLM> {
```

Localizar a chamada `generateContent` dentro de `chamarLLM`:
```ts
    const result = await model.generateContent(
      {
        contents: [{ role: 'user', parts: [{ text: mensagemAluno }] }],
      },
      { signal: controller.signal as any }
    )
```
Substituir por:
```ts
    const result = await model.generateContent(
      {
        contents: [{ role: 'user', parts: montarPartsUsuario(mensagemAluno, imagemBase64) }],
      },
      { signal: controller.signal as any }
    )
```

- [ ] **Step 9.3: Adicionar `imagemBase64?` em `chamarLLMStream` e usar o helper**

Localizar a assinatura de `chamarLLMStream`:
```ts
export async function chamarLLMStream(
  systemPrompt: string,
  contexto: string,
  mensagemAluno: string,
  persona: string,
  onChunk: (texto: string) => void
): Promise<ResultadoStream> {
```
Substituir por:
```ts
export async function chamarLLMStream(
  systemPrompt: string,
  contexto: string,
  mensagemAluno: string,
  persona: string,
  onChunk: (texto: string) => void,
  imagemBase64?: string
): Promise<ResultadoStream> {
```

Localizar a chamada `generateContentStream` dentro de `chamarLLMStream`:
```ts
    const result = await model.generateContentStream(
      { contents: [{ role: 'user', parts: [{ text: mensagemAluno }] }] },
      { signal: controller.signal as any }
    )
```
Substituir por:
```ts
    const result = await model.generateContentStream(
      { contents: [{ role: 'user', parts: montarPartsUsuario(mensagemAluno, imagemBase64) }] },
      { signal: controller.signal as any }
    )
```

- [ ] **Step 9.4: TypeScript check do servidor**

```bash
cd server && npx tsc --noEmit 2>&1 | head -30
```
Esperado: zero erros

---

### Task 10: Extrair, validar e repassar `imagem_base64` em `message.ts`

**Files:**
- Modify: `server/src/routes/message.ts`

São 3 mudanças cirúrgicas no arquivo:
1. Extração + validação de tamanho no início do handler
2. Mensagem para PSICO com prefixo `[foto anexada]`
3. Passar `imagemBase64` nas duas chamadas `chamarLLMStream` do herói

- [ ] **Step 10.1: Extrair `imagem_base64` do body e validar tamanho**

Localizar a linha que desestrutura o body (em torno de linha 74-84):
```ts
    const { aluno_id, mensagem, tipo_usuario, agente_override, nova_sessao } = req.body
```
Substituir por:
```ts
    const { aluno_id, mensagem, tipo_usuario, agente_override, nova_sessao, imagem_base64 } = req.body
    // Strip defensivo do prefixo data: (o frontend já faz isso, mas por segurança)
    const rawBase64 = typeof imagem_base64 === 'string' && imagem_base64.length > 0
      ? imagem_base64.replace(/^data:[^;]+;base64,/, '')
      : undefined
    const imagemBase64: string | undefined = rawBase64 && rawBase64.length > 0 ? rawBase64 : undefined

    // Validação de tamanho: 700KB em base64 ≈ 525KB binário (base64 tem ~33% overhead)
    if (imagemBase64 && imagemBase64.length / 1024 > 700) {
      enviarEvento('error', {
        erro: 'Imagem muito grande',
        codigo: 'IMAGEM_EXCEDE_LIMITE',
        mensagem: `Máximo 500KB. Tente compactar a imagem.`,
      })
      res.end()
      return
    }
```

- [ ] **Step 10.2: Ajustar mensagem enviada ao PSICO**

Localizar a chamada `chamarLLM` do PSICO (Caso A, em torno da linha 215):
```ts
      const respostaLLM: RespostaLLM = await chamarLLM(
        systemPrompt,
        contexto,
        mensagem.trim(),
        persona
      )
```
Substituir por:
```ts
      // PSICO não vê a imagem — recebe texto com indicação de que há foto
      const mensagemParaPsico = imagemBase64
        ? `[foto anexada] ${mensagem.trim()}`
        : mensagem.trim()

      const respostaLLM: RespostaLLM = await chamarLLM(
        systemPrompt,
        contexto,
        mensagemParaPsico,
        persona
      )
```

- [ ] **Step 10.3: Passar imagem na chamada do herói APÓS cascata**

Localizar a chamada `chamarLLMStream` dentro do bloco de cascata (Caso A, herói após PSICO, em torno da linha 299):
```ts
          const resultadoHeroi: ResultadoStream = await chamarLLMStream(
            systemPromptHeroi,
            contextoHeroi,
            mensagem.trim(),
            heroiEscolhido,
            (chunk) => {
              respostaFinal += chunk
              enviarEvento('chunk', { texto: chunk })
            }
          )
```
Substituir por:
```ts
          const resultadoHeroi: ResultadoStream = await chamarLLMStream(
            systemPromptHeroi,
            contextoHeroi,
            mensagem.trim(),
            heroiEscolhido,
            (chunk) => {
              respostaFinal += chunk
              enviarEvento('chunk', { texto: chunk })
            },
            imagemBase64  // herói vê a imagem original (não o "[foto anexada]" do PSICO)
          )
```

- [ ] **Step 10.4: Passar imagem na chamada do herói direto (Caso B, continuidade)**

Localizar a chamada `chamarLLMStream` do Caso B (herói direto, em torno da linha 345):
```ts
      const resultadoHeroi: ResultadoStream = await chamarLLMStream(
        systemPrompt,
        contexto,
        mensagem.trim(),
        persona,
        (chunk) => {
          respostaFinal += chunk
          enviarEvento('chunk', { texto: chunk })
        }
      )
```
Substituir por:
```ts
      const resultadoHeroi: ResultadoStream = await chamarLLMStream(
        systemPrompt,
        contexto,
        mensagem.trim(),
        persona,
        (chunk) => {
          respostaFinal += chunk
          enviarEvento('chunk', { texto: chunk })
        },
        imagemBase64
      )
```

- [ ] **Step 10.5: TypeScript check final — servidor**

```bash
cd server && npx tsc --noEmit 2>&1 | head -30
```
Esperado: zero erros

- [ ] **Step 10.6: Commit backend**

```bash
cd ..  # raiz do projeto
git add server/src/core/llm.ts server/src/routes/message.ts
git commit -m "feat(pe1): backend — multimodal inlineData + validação tamanho + cascata repassa imagem"
```

---

### Task 11: Validação E2E manual

- [ ] **Step 11.1: Rodar build do frontend**

```bash
cd web && npm run build 2>&1 | tail -10
```
Esperado: `built in Xs` sem erros

- [ ] **Step 11.2: Rodar typecheck completo (frontend + backend)**

```bash
cd web && npx tsc --noEmit && echo "FRONTEND OK"
cd ../server && npx tsc --noEmit && echo "BACKEND OK"
```
Esperado: `FRONTEND OK` e `BACKEND OK`

- [ ] **Step 11.3: Testar manualmente contra produção**

Com deploy ativo em `https://independent-eagerness-production-7da9.up.railway.app`:

1. Login: `leon@pense-ai.com` / perfil Layla
2. Clicar "+" → file picker abre ✅
3. Selecionar foto → thumbnail aparece no preview acima do input ✅
4. Enviar → balão do usuário exibe thumbnail ✅
5. Shimmer + badge "analisando..." aparecem durante streaming ✅
6. Herói responde sobre o conteúdo da foto ✅ (visão real)
7. Animação desaparece suavemente ✅
8. Enviar mensagem só-texto após: fluxo normal sem regressão ✅

- [ ] **Step 11.4: Commit final + atualizar docs Ralph Loop**

```bash
# Atualizar CHECKLIST_PROJETO.md: marcar PE1 como [x]
# Atualizar MEMORIA_CURTA.md: novo estado

git add docs/CHECKLIST_PROJETO.md docs/MEMORIA_CURTA.md
git commit -m "docs: PE1 concluído — botão + com visão multimodal ✅"
```

---

## Critérios de Aceite (do Spec)

- [ ] Clicar "+" abre file picker no desktop e no mobile (câmera/rolo)
- [ ] Thumbnail aparece no preview do input antes de enviar
- [ ] Balão do usuário exibe a imagem + texto (quando houver)
- [ ] Animação shimmer + badge pulsante visíveis enquanto streaming=true
- [ ] Animação desaparece suavemente quando herói responde
- [ ] Herói responde SOBRE o conteúdo da imagem (visão real)
- [ ] Sem imagem: fluxo texto puro funciona exatamente como antes (zero regressão)
- [ ] TypeScript 0 erros
- [ ] Foto > 500KB após compressão: toast de aviso no frontend, sem crash
- [ ] Foto > 700KB base64 no backend: evento SSE de erro com código `IMAGEM_EXCEDE_LIMITE`
- [ ] Na cascata (PSICO → Herói): herói recebe imagem original (não apenas "[foto anexada]")
