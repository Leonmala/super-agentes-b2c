# Fase 3 — Frontend Super Agentes Educacionais — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React SPA with 3 interface variants (Fundamental, Ensino Médio, Pai), ChatGPT-inspired design, SSE streaming chat, overlay slide menu, and profile selector modal.

**Architecture:** Single-page React app with AuthContext (JWT + profile state) and ChatContext (messages + SSE streaming). Two routes only: `/login` and `/` (protected). Profile selector is a modal overlay on `/`. Sidebar is overlay (never compresses content). Backend already exists at `server/` with endpoints: POST `/api/auth/login`, POST `/api/auth/select-profile`, POST `/api/message` (SSE).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, react-router-dom, lucide-react, react-markdown

**Spec:** `docs/superpowers/specs/2026-03-12-fase3-frontend-design.md`

---

## File Structure

```
web/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── vite.config.ts
├── public/
│   └── heroes/                    ← hero images (copied from imagens/)
│       ├── calculus-card.png
│       ├── verbetta-card.png
│       └── ... (all hero images)
├── src/
│   ├── main.tsx                   ← React entry point
│   ├── App.tsx                    ← Router setup + context providers
│   ├── index.css                  ← Tailwind imports + custom animations
│   ├── vite-env.d.ts              ← Vite type declarations
│   ├── types.ts                   ← Shared TypeScript interfaces
│   ├── constants.ts               ← Hero metadata, colors, routes
│   ├── api/
│   │   ├── client.ts              ← fetch wrapper with JWT + base URL
│   │   ├── auth.ts                ← login(), selectProfile()
│   │   └── chat.ts                ← sendMessage() with SSE parsing
│   ├── contexts/
│   │   ├── AuthContext.tsx         ← JWT token, familia, perfil, tipo_usuario
│   │   └── ChatContext.tsx         ← messages[], heroiAtivo, streaming state
│   ├── components/
│   │   ├── ProtectedRoute.tsx     ← Redirect to /login if no token
│   │   ├── ProfileModal.tsx       ← Profile selector overlay
│   │   ├── PinModal.tsx           ← 4-digit PIN input for pai
│   │   ├── ChatHeader.tsx         ← Dynamic hero avatar + name + subject
│   │   ├── ChatMessages.tsx       ← Message list with bubbles
│   │   ├── ChatBubble.tsx         ← Single message bubble (agent or user)
│   │   ├── ChatInput.tsx          ← Input bar (ChatGPT style)
│   │   ├── SlideMenu.tsx          ← Overlay sidebar
│   │   ├── EmptyState.tsx         ← Logo + greeting + CTA
│   │   └── StreamingCursor.tsx    ← Blinking cursor for streaming
│   └── pages/
│       ├── LoginPage.tsx          ← Email + password form
│       └── ChatPage.tsx           ← Main chat page (orchestrates components)
```

---

## Chunk 1: Project Scaffold + Static Shell

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `web/package.json`
- Create: `web/index.html`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.node.json`
- Create: `web/tailwind.config.ts`
- Create: `web/postcss.config.js`
- Create: `web/src/vite-env.d.ts`
- Create: `web/src/index.css`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`

- [ ] **Step 1: Create web directory and initialize Vite project**

```bash
cd /path/to/SuperAgentes_B2C_V2
npm create vite@latest web -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
cd web
npm install react-router-dom lucide-react react-markdown
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind**

Replace `web/src/index.css` with:

```css
@import "tailwindcss";

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-blink {
  animation: blink 1s infinite;
}

.animate-slide-in {
  animation: slideIn 300ms ease forwards;
}

.animate-slide-out {
  animation: slideOut 300ms ease forwards;
}

.animate-fade-in {
  animation: fadeIn 200ms ease forwards;
}
```

- [ ] **Step 4: Configure Vite with Tailwind plugin and API proxy**

Replace `web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

- [ ] **Step 5: Create minimal App.tsx with router**

```tsx
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login (TODO)</div>} />
        <Route path="/" element={<div>Chat (TODO)</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd web && npm run dev
```

Expected: Vite dev server running on port 5173, no errors.

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "feat(web): scaffold Vite + React + Tailwind project"
```

---

### Task 2: Types, constants, and API client

**Files:**
- Create: `web/src/types.ts`
- Create: `web/src/constants.ts`
- Create: `web/src/api/client.ts`
- Create: `web/src/api/auth.ts`
- Create: `web/src/api/chat.ts`

- [ ] **Step 1: Create shared types**

```typescript
// web/src/types.ts

export interface Familia {
  id: string
  email: string
  plano: string
  status: string
}

export interface Filho {
  id: string
  nome: string
  serie: string
  nivel_ensino: 'fundamental' | 'medio'
}

export interface Responsavel {
  id: string
  nome: string
}

export interface LoginResponse {
  token: string
  familia: Familia
  filhos: Filho[]
  responsavel: Responsavel | null
}

export interface SelectProfileResponse {
  sessao: {
    aluno_id?: string
    familia_id: string
    responsavel_id?: string
    tipo_usuario: 'filho' | 'pai'
  }
  tipo_interface: 'fundamental' | 'medio' | 'pai'
  aluno?: Filho
}

export type TipoUsuario = 'filho' | 'pai'
export type TipoInterface = 'fundamental' | 'medio' | 'pai'

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  agente?: string
  timestamp: number
}

export interface SSEEvent {
  event: string
  data: Record<string, unknown>
}

export type HeroId =
  | 'CALCULUS' | 'VERBETTA' | 'NEURON' | 'TEMPUS'
  | 'GAIA' | 'VECTOR' | 'ALKA' | 'FLEX'

export interface HeroMeta {
  id: HeroId
  nome: string
  materia: string
  cor: string
  corGradient: string
  avatar: string          // _buble.png — circular face (header + chat bubbles)
  card: string            // -card.png — full body illustration
  logo: string | null     // -logo.png — name + subject text (neuron has none)
  limpo: string           // -limpo.png — name only text
}
```

- [ ] **Step 2: Create hero constants**

```typescript
// web/src/constants.ts
import type { HeroMeta, HeroId } from './types'

export const HEROES: Record<HeroId, HeroMeta> = {
  CALCULUS: {
    id: 'CALCULUS',
    nome: 'Calculus',
    materia: 'Matemática',
    cor: '#2563EB',
    corGradient: 'from-orange-500 to-red-500',
    avatar: '/heroes/calculus_buble.png',     // circular face (chat header + bubbles)
    card: '/heroes/calculus-card.png',         // full body illustration
    logo: '/heroes/calculus-logo.png',         // name + subject
    limpo: '/heroes/calculus-limpo.png',       // name only
  },
  VERBETTA: {
    id: 'VERBETTA',
    nome: 'Verbetta',
    materia: 'Português',
    cor: '#7C3AED',
    corGradient: 'from-purple-500 to-violet-500',
    avatar: '/heroes/verbetta_buble.png',
    card: '/heroes/verbetta-card.png',
    logo: '/heroes/verbetta-logo.png',
    limpo: '/heroes/verbetta-limpo.png',
  },
  NEURON: {
    id: 'NEURON',
    nome: 'Neuron',
    materia: 'Ciências / Biologia',
    cor: '#059669',
    corGradient: 'from-emerald-500 to-green-500',
    avatar: '/heroes/neuron_buble.png',
    card: '/heroes/neuron-card.png',
    logo: null,                                // neuron has no logo file
    limpo: '/heroes/neuron-limpo.png',
  },
  TEMPUS: {
    id: 'TEMPUS',
    nome: 'Tempus',
    materia: 'História',
    cor: '#d97706',
    corGradient: 'from-amber-500 to-yellow-600',
    avatar: '/heroes/tempus_buble.png',
    card: '/heroes/tempus-card.png',
    logo: '/heroes/tempus-logo.png',
    limpo: '/heroes/tempus-limpo.png',
  },
  GAIA: {
    id: 'GAIA',
    nome: 'Gaia',
    materia: 'Geografia',
    cor: '#0d9488',
    corGradient: 'from-teal-500 to-cyan-500',
    avatar: '/heroes/gaia_buble.png',
    card: '/heroes/gaia-card.png',
    logo: '/heroes/gaia-logo.png',
    limpo: '/heroes/gaia-limpo.png',
  },
  VECTOR: {
    id: 'VECTOR',
    nome: 'Vector',
    materia: 'Física',
    cor: '#2563EB',
    corGradient: 'from-cyan-500 to-blue-500',
    avatar: '/heroes/vector_buble.png',
    card: '/heroes/vector-card.png',
    logo: '/heroes/vector-logo.png',
    limpo: '/heroes/vector-limpo.png',
  },
  ALKA: {
    id: 'ALKA',
    nome: 'Alka',
    materia: 'Química',
    cor: '#dc2626',
    corGradient: 'from-red-500 to-pink-500',
    avatar: '/heroes/alka_buble.png',
    card: '/heroes/alka-card.png',
    logo: '/heroes/alka-logo.png',
    limpo: '/heroes/alka-limpo.png',
  },
  FLEX: {
    id: 'FLEX',
    nome: 'Flexy',
    materia: 'Inglês e Espanhol',
    cor: '#7c3aed',
    corGradient: 'from-indigo-500 to-purple-500',
    avatar: '/heroes/flexy_buble.png',
    card: '/heroes/flexy-card.png',
    logo: '/heroes/flexy-logo.png',
    limpo: '/heroes/flexy-limpo.png',
  },
}

export const INTERFACE_COLORS = {
  fundamental: '#2563EB',
  medio: '#7C3AED',
  pai: '#059669',
} as const
```

- [ ] **Step 3: Create API client (fetch wrapper)**

```typescript
// web/src/api/client.ts

const BASE_URL = '/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sa_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    throw new ApiError(res.status, body.erro || `HTTP ${res.status}`)
  }

  return res.json()
}
```

- [ ] **Step 4: Create auth API functions**

```typescript
// web/src/api/auth.ts
import { apiFetch } from './client'
import type { LoginResponse, SelectProfileResponse } from '../types'

export async function login(email: string, senha: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export async function selectProfile(
  perfilId: string,
  tipo: 'filho' | 'pai',
  pin?: string
): Promise<SelectProfileResponse> {
  return apiFetch<SelectProfileResponse>('/auth/select-profile', {
    method: 'POST',
    body: JSON.stringify({ perfil_id: perfilId, tipo, pin }),
  })
}
```

- [ ] **Step 5: Create chat API with SSE parsing**

```typescript
// web/src/api/chat.ts

export interface SendMessageOptions {
  alunoId: string
  mensagem: string
  tipoUsuario?: 'filho' | 'pai'
  agenteOverride?: string
  onAgente: (agente: string) => void
  onChunk: (texto: string) => void
  onDone: (data: Record<string, unknown>) => void
  onError: (erro: string) => void
  onLimite: (mensagem: string) => void
}

export async function sendMessage(opts: SendMessageOptions): Promise<void> {
  const token = localStorage.getItem('sa_token')
  if (!token) throw new Error('Não autenticado')

  const res = await fetch('/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      aluno_id: opts.alunoId,
      mensagem: opts.mensagem,
      tipo_usuario: opts.tipoUsuario || 'filho',
      agente_override: opts.agenteOverride,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    opts.onError(body.erro || `HTTP ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    opts.onError('Stream não suportado')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Parse SSE events from buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // keep incomplete line

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const dataStr = line.slice(6)
        try {
          const data = JSON.parse(dataStr)
          switch (currentEvent) {
            case 'agente':
              opts.onAgente(data.agente)
              break
            case 'chunk':
              opts.onChunk(data.texto)
              break
            case 'done':
              opts.onDone(data)
              break
            case 'error':
              opts.onError(data.erro)
              break
            case 'limite':
              opts.onLimite(data.mensagem)
              break
          }
        } catch {
          // ignore parse errors
        }
        currentEvent = ''
      }
    }
  }
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/types.ts web/src/constants.ts web/src/api/
git commit -m "feat(web): add types, hero constants, and API client layer"
```

---

### Task 3: AuthContext

**Files:**
- Create: `web/src/contexts/AuthContext.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Create AuthContext**

```tsx
// web/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Familia, Filho, Responsavel, TipoInterface, TipoUsuario } from '../types'
import * as authApi from '../api/auth'

interface PerfilAtivo {
  alunoId?: string
  responsavelId?: string
  selectedFilhoId?: string  // For pai mode: which child is active
  tipoUsuario: TipoUsuario
  tipoInterface: TipoInterface
  nome: string
}

interface AuthState {
  token: string | null
  familia: Familia | null
  filhos: Filho[]
  responsavel: Responsavel | null
  perfilAtivo: PerfilAtivo | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>
  selectFilho: (filhoId: string) => Promise<void>
  selectPai: (pin: string) => Promise<void>
  selectFilhoPai: (filhoId: string) => void  // Switch active child in pai mode
  trocarPerfil: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('sa_token'),
    familia: null,
    filhos: [],
    responsavel: null,
    perfilAtivo: null,
    loading: false,
  })

  // Restore familia data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sa_familia_data')
    if (saved && state.token) {
      try {
        const data = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          familia: data.familia,
          filhos: data.filhos,
          responsavel: data.responsavel,
        }))
      } catch {
        // corrupted data, ignore
      }
    }
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const res = await authApi.login(email, senha)
      localStorage.setItem('sa_token', res.token)
      localStorage.setItem('sa_familia_data', JSON.stringify({
        familia: res.familia,
        filhos: res.filhos,
        responsavel: res.responsavel,
      }))
      setState({
        token: res.token,
        familia: res.familia,
        filhos: res.filhos,
        responsavel: res.responsavel,
        perfilAtivo: null,
        loading: false,
      })
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }))
      throw err
    }
  }, [])

  const selectFilho = useCallback(async (filhoId: string) => {
    const filho = state.filhos.find(f => f.id === filhoId)
    if (!filho) throw new Error('Filho não encontrado')

    const res = await authApi.selectProfile(filhoId, 'filho')
    setState(prev => ({
      ...prev,
      perfilAtivo: {
        alunoId: filho.id,
        tipoUsuario: 'filho',
        tipoInterface: res.tipo_interface,
        nome: filho.nome,
      },
    }))
  }, [state.filhos])

  const selectPai = useCallback(async (pin: string) => {
    if (!state.responsavel) throw new Error('Responsável não encontrado')

    await authApi.selectProfile(state.responsavel.id, 'pai', pin)
    // Default to first child for pai mode
    const firstChild = state.filhos[0]
    setState(prev => ({
      ...prev,
      perfilAtivo: {
        responsavelId: state.responsavel!.id,
        selectedFilhoId: firstChild?.id,
        tipoUsuario: 'pai',
        tipoInterface: 'pai',
        nome: state.responsavel!.nome,
      },
    }))
  }, [state.responsavel, state.filhos])

  const selectFilhoPai = useCallback((filhoId: string) => {
    setState(prev => prev.perfilAtivo ? ({
      ...prev,
      perfilAtivo: { ...prev.perfilAtivo, selectedFilhoId: filhoId },
    }) : prev)
  }, [])

  const trocarPerfil = useCallback(() => {
    setState(prev => ({ ...prev, perfilAtivo: null }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_familia_data')
    setState({
      token: null,
      familia: null,
      filhos: [],
      responsavel: null,
      perfilAtivo: null,
      loading: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, selectFilho, selectPai, selectFilhoPai, trocarPerfil, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Update App.tsx with AuthProvider**

```tsx
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div>Login (TODO)</div>} />
          <Route path="/" element={<div>Chat (TODO)</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/contexts/AuthContext.tsx web/src/App.tsx
git commit -m "feat(web): add AuthContext with login, profile selection, and logout"
```

---

### Task 4: ChatContext with SSE streaming

**Files:**
- Create: `web/src/contexts/ChatContext.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Create ChatContext**

```tsx
// web/src/contexts/ChatContext.tsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage, HeroId } from '../types'
import { sendMessage } from '../api/chat'
import { useAuth } from './AuthContext'

interface ChatContextValue {
  mensagens: ChatMessage[]
  heroiAtivo: HeroId | null
  streaming: boolean
  streamingText: string
  erro: string | null
  limiteMsg: string | null
  enviar: (texto: string, agenteOverride?: string) => Promise<void>
  limpar: () => void
  dismissErro: () => void
  dismissLimite: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { perfilAtivo } = useAuth()
  const [mensagens, setMensagens] = useState<ChatMessage[]>([])
  const [heroiAtivo, setHeroiAtivo] = useState<HeroId | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [limiteMsg, setLimiteMsg] = useState<string | null>(null)
  const streamRef = useRef('')

  const enviar = useCallback(async (texto: string, agenteOverride?: string) => {
    if (!perfilAtivo) return
    if (streaming) return

    const alunoId = perfilAtivo.alunoId
    if (!alunoId && perfilAtivo.tipoUsuario === 'filho') return

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
    }
    setMensagens(prev => [...prev, userMsg])

    // Start streaming
    setStreaming(true)
    setStreamingText('')
    streamRef.current = ''
    setErro(null)

    // For pai mode, use the selectedFilhoId (active child)
    const targetAlunoId = alunoId || perfilAtivo.selectedFilhoId || ''

    await sendMessage({
      alunoId: targetAlunoId,
      mensagem: texto,
      tipoUsuario: perfilAtivo.tipoUsuario,
      agenteOverride,
      onAgente: (agente) => {
        setHeroiAtivo(agente as HeroId)
      },
      onChunk: (textoChunk) => {
        streamRef.current += textoChunk
        setStreamingText(streamRef.current)
      },
      onDone: (data) => {
        // Finalize: add agent message
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: streamRef.current,
          agente: (data.agente as string) || undefined,
          timestamp: Date.now(),
        }
        setMensagens(prev => [...prev, agentMsg])
        setStreaming(false)
        setStreamingText('')
        streamRef.current = ''
      },
      onError: (erroMsg) => {
        setErro(erroMsg)
        setStreaming(false)
        setStreamingText('')
        streamRef.current = ''
      },
      onLimite: (msg) => {
        setLimiteMsg(msg)
        setStreaming(false)
        setStreamingText('')
        streamRef.current = ''
      },
    })
  }, [perfilAtivo, streaming])

  const limpar = useCallback(() => {
    setMensagens([])
    setHeroiAtivo(null)
    setStreamingText('')
    streamRef.current = ''
  }, [])

  const dismissErro = useCallback(() => setErro(null), [])
  const dismissLimite = useCallback(() => setLimiteMsg(null), [])

  return (
    <ChatContext.Provider value={{
      mensagens, heroiAtivo, streaming, streamingText,
      erro, limiteMsg, enviar, limpar, dismissErro, dismissLimite,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be inside ChatProvider')
  return ctx
}
```

- [ ] **Step 2: Update App.tsx with ChatProvider**

```tsx
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<div>Login (TODO)</div>} />
            <Route path="/" element={<div>Chat (TODO)</div>} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/contexts/ChatContext.tsx web/src/App.tsx
git commit -m "feat(web): add ChatContext with SSE streaming support"
```

---

## Chunk 2: Login + Profile Selection

### Task 5: LoginPage

**Files:**
- Create: `web/src/pages/LoginPage.tsx`
- Create: `web/src/components/ProtectedRoute.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Create ProtectedRoute**

```tsx
// web/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Create LoginPage**

```tsx
// web/src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login, loading, token } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect
  if (token) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    try {
      await login(email, senha)
      navigate('/')
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold">SA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Super Agentes</h1>
          <p className="text-sm text-gray-500 mt-1">Pense-AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire up routes in App.tsx**

```tsx
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <div>Chat (TODO)</div>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 4: Verify dev server shows login page**

```bash
cd web && npm run dev
```

Open http://localhost:5173/login — should see styled login form.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/LoginPage.tsx web/src/components/ProtectedRoute.tsx web/src/App.tsx
git commit -m "feat(web): add LoginPage and ProtectedRoute"
```

---

### Task 6: ProfileModal and PinModal

**Files:**
- Create: `web/src/components/ProfileModal.tsx`
- Create: `web/src/components/PinModal.tsx`

- [ ] **Step 1: Create ProfileModal**

```tsx
// web/src/components/ProfileModal.tsx
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { PinModal } from './PinModal'

export function ProfileModal() {
  const { filhos, responsavel, selectFilho, perfilAtivo } = useAuth()
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Don't show if profile already selected
  if (perfilAtivo) return null

  const handleFilho = async (filhoId: string) => {
    setLoading(true)
    try {
      await selectFilho(filhoId)
    } catch {
      // handle error
    }
    setLoading(false)
  }

  if (showPin) {
    return <PinModal onCancel={() => setShowPin(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Quem está estudando?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Selecione o perfil</p>

        <div className="space-y-3">
          {filhos.map(filho => (
            <button
              key={filho.id}
              onClick={() => handleFilho(filho.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {filho.nome.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">{filho.nome}</p>
                <p className="text-xs text-gray-500">{filho.serie}</p>
              </div>
            </button>
          ))}

          {responsavel && (
            <>
              <div className="border-t border-gray-200 my-2" />
              <button
                onClick={() => setShowPin(true)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {responsavel.nome.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{responsavel.nome}</p>
                  <p className="text-xs text-gray-500">Responsável</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PinModal**

```tsx
// web/src/components/PinModal.tsx
import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface PinModalProps {
  onCancel: () => void
}

export function PinModal({ onCancel }: PinModalProps) {
  const { selectPai } = useAuth()
  const [digits, setDigits] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const addDigit = useCallback((d: string) => {
    if (digits.length >= 4) return
    const next = [...digits, d]
    setDigits(next)
    setErro('')

    // Auto-submit when 4 digits entered
    if (next.length === 4) {
      const pin = next.join('')
      setLoading(true)
      selectPai(pin).catch((err: any) => {
        setErro(err.message || 'PIN inválido')
        setDigits([])
        setLoading(false)
      })
    }
  }, [digits, selectPai])

  const removeDigit = useCallback(() => {
    setDigits(prev => prev.slice(0, -1))
    setErro('')
  }, [])

  const numpad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">PIN do Responsável</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Digite seu PIN de 4 dígitos</p>

        {/* Dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < digits.length ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {erro && (
          <p className="text-sm text-red-600 text-center mb-4">{erro}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {numpad.map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === '⌫') removeDigit()
                else if (key !== '') addDigit(key)
              }}
              disabled={loading || key === ''}
              className={`h-12 rounded-xl text-lg font-semibold transition-colors ${
                key === ''
                  ? 'invisible'
                  : key === '⌫'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300'
              } disabled:opacity-50`}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ProfileModal.tsx web/src/components/PinModal.tsx
git commit -m "feat(web): add ProfileModal and PinModal components"
```

---

## Chunk 3: Chat UI Components

### Task 7: Chat components (EmptyState, ChatBubble, StreamingCursor, ChatMessages)

**Files:**
- Create: `web/src/components/EmptyState.tsx`
- Create: `web/src/components/StreamingCursor.tsx`
- Create: `web/src/components/ChatBubble.tsx`
- Create: `web/src/components/ChatMessages.tsx`

- [ ] **Step 1: Create EmptyState**

```tsx
// web/src/components/EmptyState.tsx
import { useAuth } from '../contexts/AuthContext'

export function EmptyState() {
  const { perfilAtivo } = useAuth()
  const nome = perfilAtivo?.nome || 'aluno'

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <span className="text-white text-3xl font-bold">SA</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Olá, {nome}!
      </h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Sobre qual matéria você quer estudar hoje? É só perguntar!
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create StreamingCursor**

```tsx
// web/src/components/StreamingCursor.tsx
export function StreamingCursor({ color = '#2563EB' }: { color?: string }) {
  return (
    <span
      className="inline-block w-1.5 h-4 rounded-sm align-middle ml-0.5 animate-blink"
      style={{ backgroundColor: color }}
    />
  )
}
```

- [ ] **Step 3: Create ChatBubble**

```tsx
// web/src/components/ChatBubble.tsx
import ReactMarkdown from 'react-markdown'
import type { ChatMessage, HeroId } from '../types'
import { HEROES } from '../constants'
import { StreamingCursor } from './StreamingCursor'

// Only allow safe markdown elements
const ALLOWED_ELEMENTS = [
  'p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'blockquote', 'br', 'hr',
]

interface ChatBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  streamingText?: string
}

export function ChatBubble({ message, isStreaming, streamingText }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const hero = message.agente ? HEROES[message.agente as HeroId] : null
  const corHeroi = hero?.cor || '#2563EB'

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-sm"
          style={{ backgroundColor: corHeroi }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  // Agent bubble
  const content = isStreaming ? (streamingText || '') : message.content

  return (
    <div className="flex gap-2 mb-3 items-start">
      {hero ? (
        <img
          src={hero.avatar}
          alt={hero.nome}
          className="w-8 h-8 rounded-full object-cover shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          SA
        </div>
      )}
      <div className="max-w-[80%] bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm">
        <ReactMarkdown allowedElements={ALLOWED_ELEMENTS}>{content}</ReactMarkdown>
        {isStreaming && <StreamingCursor color={corHeroi} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ChatMessages**

```tsx
// web/src/components/ChatMessages.tsx
import { useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { ChatBubble } from './ChatBubble'
import { EmptyState } from './EmptyState'
import type { ChatMessage } from '../types'

export function ChatMessages() {
  const { mensagens, streaming, streamingText, heroiAtivo } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages/streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, streamingText])

  if (mensagens.length === 0 && !streaming) {
    return <EmptyState />
  }

  // Placeholder for streaming agent message
  const streamingMsg: ChatMessage | null = streaming ? {
    id: 'streaming',
    role: 'agent',
    content: '',
    agente: heroiAtivo || undefined,
    timestamp: Date.now(),
  } : null

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {mensagens.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      {streamingMsg && (
        <ChatBubble
          message={streamingMsg}
          isStreaming
          streamingText={streamingText}
        />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/EmptyState.tsx web/src/components/StreamingCursor.tsx web/src/components/ChatBubble.tsx web/src/components/ChatMessages.tsx
git commit -m "feat(web): add chat message components with markdown + streaming"
```

---

### Task 8: ChatHeader, ChatInput, SlideMenu

**Files:**
- Create: `web/src/components/ChatHeader.tsx`
- Create: `web/src/components/ChatInput.tsx`
- Create: `web/src/components/SlideMenu.tsx`

- [ ] **Step 1: Create ChatHeader**

```tsx
// web/src/components/ChatHeader.tsx
import { Menu } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

interface ChatHeaderProps {
  onMenuToggle: () => void
}

export function ChatHeader({ onMenuToggle }: ChatHeaderProps) {
  const { heroiAtivo } = useChat()
  const { perfilAtivo } = useAuth()
  const hero = heroiAtivo ? HEROES[heroiAtivo as HeroId] : null
  const isPai = perfilAtivo?.tipoUsuario === 'pai'

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
      <button
        onClick={onMenuToggle}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Menu"
      >
        <Menu size={22} className="text-gray-600" />
      </button>

      {hero ? (
        <>
          <img
            src={hero.avatar}
            alt={hero.nome}
            className="w-9 h-9 rounded-full object-cover transition-all duration-300"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{hero.nome}</p>
            <p className="text-xs text-gray-500 truncate">{hero.materia}</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            SA
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Super Agentes</p>
            <p className="text-xs text-gray-500">Pense-AI</p>
          </div>
        </>
      )}

      {isPai && (
        <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          MODO PAI
        </span>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Create ChatInput**

```tsx
// web/src/components/ChatInput.tsx
import { useState, useRef, useEffect } from 'react'
import { Send, Plus } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'

export function ChatInput() {
  const [texto, setTexto] = useState('')
  const { enviar, streaming } = useChat()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [texto])

  const handleSubmit = () => {
    const trimmed = texto.trim()
    if (!trimmed || streaming) return
    enviar(trimmed)
    setTexto('')
    // Reset height
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

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <button
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 mb-0.5"
          aria-label="Anexar"
        >
          <Plus size={20} />
        </button>

        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-end">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 placeholder-gray-400 max-h-28"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!texto.trim() || streaming}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:hover:bg-blue-600 shrink-0 mb-0.5"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SlideMenu**

```tsx
// web/src/components/SlideMenu.tsx
import { X, BookOpen, GraduationCap, Bot, Eye, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import type { TipoInterface } from '../types'

interface SlideMenuProps {
  open: boolean
  onClose: () => void
}

export function SlideMenu({ open, onClose }: SlideMenuProps) {
  const { perfilAtivo, filhos, trocarPerfil, selectFilhoPai, logout } = useAuth()
  const { limpar } = useChat()
  const tipoInterface: TipoInterface = perfilAtivo?.tipoInterface || 'fundamental'
  const isPai = tipoInterface === 'pai'

  const handleTrocarPerfil = () => {
    limpar()
    trocarPerfil()
    onClose()
  }

  const handleLogout = () => {
    limpar()
    logout()
    onClose()
  }

  // Menu items based on interface type
  const menuItems = [
    { label: 'Super Agentes', icon: BookOpen, always: true },
    { label: 'Professor de IA', icon: Bot, always: true },
    ...(isPai ? [
      { label: 'Supervisor', icon: Eye, always: false },
    ] : []),
  ]

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">SA</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Super Agentes</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Menu items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <item.icon size={18} className="text-gray-500" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Pai: child selector */}
          {isPai && filhos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Filho ativo</p>
              <div className="space-y-1">
                {filhos.map(filho => {
                  const isActive = perfilAtivo?.selectedFilhoId === filho.id
                  return (
                    <button
                      key={filho.id}
                      onClick={() => { selectFilhoPai(filho.id); onClose() }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {filho.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{filho.nome}</span>
                      {isActive && <span className="ml-auto text-xs text-blue-600">●</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="px-3 py-3 border-t border-gray-200 space-y-1">
            <button
              onClick={handleTrocarPerfil}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftRight size={18} className="text-gray-400" />
              Trocar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={18} className="text-red-400" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ChatHeader.tsx web/src/components/ChatInput.tsx web/src/components/SlideMenu.tsx
git commit -m "feat(web): add ChatHeader, ChatInput, and SlideMenu components"
```

---

## Chunk 4: ChatPage Assembly + Hero Images + CORS

### Task 9: ChatPage — Orchestrate all components

**Files:**
- Create: `web/src/pages/ChatPage.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Create ChatPage**

```tsx
// web/src/pages/ChatPage.tsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { ProfileModal } from '../components/ProfileModal'
import { ChatHeader } from '../components/ChatHeader'
import { ChatMessages } from '../components/ChatMessages'
import { ChatInput } from '../components/ChatInput'
import { SlideMenu } from '../components/SlideMenu'

export function ChatPage() {
  const { perfilAtivo } = useAuth()
  const { erro, limiteMsg, dismissErro, dismissLimite } = useChat()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Profile selector modal (shows when no profile selected) */}
      {!perfilAtivo && <ProfileModal />}

      {/* Error/Limite toast */}
      {erro && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shrink-0">
          <p className="text-sm text-red-700">{erro}</p>
          <button onClick={dismissErro} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
        </div>
      )}
      {limiteMsg && (
        <div className="mx-4 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shrink-0">
          <p className="text-sm text-amber-700">{limiteMsg}</p>
          <button onClick={dismissLimite} className="text-amber-400 hover:text-amber-600 text-sm ml-2">✕</button>
        </div>
      )}

      {/* Chat layout */}
      <ChatHeader onMenuToggle={() => setMenuOpen(true)} />
      <ChatMessages />
      <ChatInput />

      {/* Slide menu overlay */}
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Wire up ChatPage in App.tsx**

```tsx
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/ChatPage.tsx web/src/App.tsx
git commit -m "feat(web): assemble ChatPage with all components"
```

---

### Task 10: Copy hero images to public/heroes/

**Files:**
- Create: `web/public/heroes/` (copy from `imagens/`)

- [ ] **Step 1: Copy hero images**

```bash
mkdir -p web/public/heroes
cp imagens/*.png web/public/heroes/
```

- [ ] **Step 2: Verify images are accessible**

With dev server running, open http://localhost:5173/heroes/calculus-card.png — should show hero image.

- [ ] **Step 3: Commit**

```bash
git add web/public/heroes/
git commit -m "feat(web): add hero images to public assets"
```

---

### Task 11: Enable CORS in backend for dev

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Verify CORS is already configured**

The backend `server/src/index.ts` already has `app.use(cors())` — this allows all origins, which is fine for development. For production, restrict to the frontend domain.

No changes needed. Move to next task.

---

## Chunk 5: Integration Test + Gate 3

### Task 12: Manual integration test

- [ ] **Step 1: Start backend server**

```bash
cd server && npm run dev
```

Expected: Server on port 3001.

- [ ] **Step 2: Start frontend dev server**

```bash
cd web && npm run dev
```

Expected: Vite on port 5173.

- [ ] **Step 3: Test login flow**

Open http://localhost:5173 → should redirect to /login → enter test credentials → should redirect to / → ProfileModal should appear.

- [ ] **Step 4: Test profile selection**

Click a child profile → modal closes → EmptyState with greeting shown.

- [ ] **Step 5: Test chat**

Type a math question → SSE stream starts → hero avatar appears in header → messages render with markdown → streaming cursor shows during response.

- [ ] **Step 6: Test slide menu**

Click hamburger → menu slides in → verify items match interface type → click backdrop to close.

- [ ] **Step 7: Test trocar perfil**

Open menu → click "Trocar perfil" → ProfileModal reappears → select different profile.

- [ ] **Step 8: Fix any issues found during testing**

Address each issue as individual commits.

---

### Task 13: Gate 3 automated test (basic smoke)

**Files:**
- Create: `web/src/__tests__/smoke.test.tsx` (if vitest configured) OR manual checklist

- [ ] **Step 1: Add Vitest to web project**

```bash
cd web && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Configure Vitest in vite.config.ts**

Add to `vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

- [ ] **Step 3: Create test setup**

```typescript
// web/src/__tests__/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write smoke tests**

```typescript
// web/src/__tests__/smoke.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { ChatProvider } from '../contexts/ChatContext'
import { LoginPage } from '../pages/LoginPage'

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

describe('Gate 3 — Frontend Smoke Tests', () => {
  it('renders login page with form', () => {
    render(<LoginPage />, { wrapper: TestWrapper })
    expect(screen.getByText('Super Agentes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('renders hero constants correctly', async () => {
    const { HEROES } = await import('../constants')
    expect(Object.keys(HEROES)).toHaveLength(8)
    expect(HEROES.CALCULUS.materia).toBe('Matemática')
    expect(HEROES.VERBETTA.materia).toBe('Português')
  })

  it('API client module loads', async () => {
    const { apiFetch } = await import('../api/client')
    expect(typeof apiFetch).toBe('function')
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd web && npx vitest run
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Add test script to package.json**

Add to `web/package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "test(web): add Gate 3 smoke tests with Vitest"
```

---

### Task 14: Update Ralph Loop documents

**Files:**
- Modify: `docs/CHECKLIST_PROJETO.md`
- Modify: `docs/MEMORIA_CURTA.md`
- Modify: `docs/MEMORIA_LONGA.md`

- [ ] **Step 1: Mark Fase 3 tasks complete in CHECKLIST**

Update tasks 3.1-3.4, 3.T, GATE 3 as [x] with date.

- [ ] **Step 2: Update MEMORIA_CURTA with Fase 3 completion state**

- [ ] **Step 3: Add Fase 3 entry to MEMORIA_LONGA**

Record key decisions, file structure, and architecture choices.

- [ ] **Step 4: Commit docs**

```bash
git add docs/
git commit -m "docs: update Ralph Loop docs for Gate 3 completion"
```
