import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage, HeroId } from '../types'
import { sendMessage } from '../api/chat'
import { useAuth } from './AuthContext'
import type { QuizGerado, QuizResultado } from '../components/QuizCard'

interface ChatContextValue {
  mensagens: ChatMessage[]
  heroiAtivo: HeroId | null
  streaming: boolean
  pendingReveal: ChatMessage | null
  erro: string | null
  limiteMsg: string | null
  agenteMenu: string
  setAgenteMenu: (agente: string) => void
  quizAtivo: QuizGerado | null
  fecharQuiz: (resultado?: QuizResultado) => void
  enviar: (texto: string, agenteOverride?: string, imagemBase64?: string) => Promise<void>
  addMessage: (msg: ChatMessage) => void
  clearPendingReveal: () => void
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
  const [pendingReveal, setPendingReveal] = useState<ChatMessage | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [limiteMsg, setLimiteMsg] = useState<string | null>(null)
  const [agenteMenu, setAgenteMenu] = useState<string>('super_agentes')
  const [quizAtivo, setQuizAtivo] = useState<QuizGerado | null>(null)
  const fullTextRef = useRef('')
  const isFirstMessageRef = useRef(true)

  // Ref para enviar — permite fecharQuiz chamar enviar sem deps circulares
  const enviarRef = useRef<((texto: string) => Promise<void>) | null>(null)

  const fecharQuiz = useCallback((resultado?: QuizResultado) => {
    setQuizAtivo(null)
    if (resultado) {
      // Monta mensagem estruturada que o herói ativo recebe para fechamento pedagógico
      const { acertos, total, questoesErradas } = resultado
      const pct = Math.round((acertos / total) * 100)
      const linhaErros = questoesErradas.length > 0
        ? ` Errei as questões: ${questoesErradas.join(', ')}.`
        : ' Acertei todas!'
      const msg = `[Quiz concluído] ${acertos}/${total} acertos (${pct}%).${linhaErros}`
      // Pequeno delay para garantir que o overlay fechou antes do novo turno
      setTimeout(() => {
        void enviarRef.current?.(msg)
      }, 300)
    }
  }, [])

  const addMessage = useCallback((msg: ChatMessage) => {
    setMensagens(prev => [...prev, msg])
  }, [])

  const clearPendingReveal = useCallback(() => {
    setPendingReveal(null)
  }, [])

  const enviar = useCallback(async (texto: string, agenteOverride?: string, imagemBase64?: string) => {
    if (!perfilAtivo) return
    if (streaming) return

    const alunoId = perfilAtivo.alunoId

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
      imageUrl: imagemBase64 ? `data:image/jpeg;base64,${imagemBase64}` : undefined,
    }
    setMensagens(prev => [...prev, userMsg])

    setStreaming(true)
    fullTextRef.current = ''
    setErro(null)

    const novaSessao = isFirstMessageRef.current
    isFirstMessageRef.current = false

    const targetAlunoId = alunoId || perfilAtivo.selectedFilhoId || ''

    await sendMessage({
      alunoId: targetAlunoId,
      mensagem: texto,
      tipoUsuario: perfilAtivo.tipoUsuario,
      agenteOverride,
      novaSessao,
      imagemBase64,
      onAgente: (agente) => {
        setHeroiAtivo(agente as HeroId)
      },
      onChunk: (textoChunk) => {
        // Servidor envia texto completo de uma vez (ou em chunks grandes)
        // Apenas acumular — o useBubbleReveal no ChatMessages controla a revelação
        fullTextRef.current += textoChunk
      },
      onDone: (data) => {
        const finalText = fullTextRef.current
        const agente = (data.agente as string) || undefined

        // Criar mensagem e sinalizar para ChatMessages iniciar reveal
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: finalText,
          agente,
          timestamp: Date.now(),
        }
        setPendingReveal(agentMsg)
        setStreaming(false)
        fullTextRef.current = ''
      },
      onError: (erroMsg) => {
        setErro(erroMsg)
        setStreaming(false)
        fullTextRef.current = ''
      },
      onLimite: (msg) => {
        setLimiteMsg(msg)
        setStreaming(false)
        fullTextRef.current = ''
      },
      onQuiz: (quiz) => {
        // Super Prova emitiu QUIZ — abrir QuizCard
        setQuizAtivo(quiz)
      },
    })
  }, [perfilAtivo, streaming])

  // Manter ref sincronizado a cada render — permite fecharQuiz usar enviar sem deps circulares
  enviarRef.current = enviar

  const limpar = useCallback(() => {
    setMensagens([])
    setHeroiAtivo(null)
    setPendingReveal(null)
    fullTextRef.current = ''
    isFirstMessageRef.current = true
  }, [])

  const dismissErro = useCallback(() => setErro(null), [])
  const dismissLimite = useCallback(() => setLimiteMsg(null), [])

  return (
    <ChatContext.Provider value={{
      mensagens, heroiAtivo, streaming,
      pendingReveal,
      erro, limiteMsg, agenteMenu, setAgenteMenu,
      quizAtivo, fecharQuiz,
      enviar, addMessage, clearPendingReveal,
      limpar, dismissErro, dismissLimite,
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
