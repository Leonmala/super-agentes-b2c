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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
    }
    setMensagens(prev => [...prev, userMsg])

    setStreaming(true)
    setStreamingText('')
    streamRef.current = ''
    setErro(null)

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
