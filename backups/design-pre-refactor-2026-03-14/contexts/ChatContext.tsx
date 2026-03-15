import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage, HeroId } from '../types'
import { sendMessage } from '../api/chat'
import { useAuth } from './AuthContext'
import { useTypingEffect } from '../hooks/useTypingEffect'

interface ChatContextValue {
  mensagens: ChatMessage[]
  heroiAtivo: HeroId | null
  streaming: boolean
  streamingText: string
  isRevealing: boolean
  erro: string | null
  limiteMsg: string | null
  agenteMenu: string
  setAgenteMenu: (agente: string) => void
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
  const [erro, setErro] = useState<string | null>(null)
  const [limiteMsg, setLimiteMsg] = useState<string | null>(null)
  const [agenteMenu, setAgenteMenu] = useState<string>('super_agentes')
  const fullTextRef = useRef('')

  const typing = useTypingEffect()

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
    typing.reset()
    fullTextRef.current = ''
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
        fullTextRef.current += textoChunk
        typing.addChunk(textoChunk)
      },
      onDone: (data) => {
        const finalText = fullTextRef.current
        const agente = (data.agente as string) || undefined

        // Flush acelera o reveal e chama callback quando terminar
        typing.flush(() => {
          const agentMsg: ChatMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: finalText,
            agente,
            timestamp: Date.now(),
          }
          setMensagens(prev => [...prev, agentMsg])
          setStreaming(false)
          typing.reset()
          fullTextRef.current = ''
        })
      },
      onError: (erroMsg) => {
        setErro(erroMsg)
        setStreaming(false)
        typing.reset()
        fullTextRef.current = ''
      },
      onLimite: (msg) => {
        setLimiteMsg(msg)
        setStreaming(false)
        typing.reset()
        fullTextRef.current = ''
      },
    })
  }, [perfilAtivo, streaming, typing])

  const limpar = useCallback(() => {
    setMensagens([])
    setHeroiAtivo(null)
    typing.reset()
    fullTextRef.current = ''
  }, [typing])

  const dismissErro = useCallback(() => setErro(null), [])
  const dismissLimite = useCallback(() => setLimiteMsg(null), [])

  return (
    <ChatContext.Provider value={{
      mensagens, heroiAtivo, streaming,
      streamingText: typing.displayText,
      isRevealing: typing.isRevealing,
      erro, limiteMsg, agenteMenu, setAgenteMenu,
      enviar, limpar, dismissErro, dismissLimite,
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
