import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, HeroId } from '../types'
import { HEROES } from '../constants'
import { useAuth } from '../contexts/AuthContext'

// Elementos permitidos — inclui tabelas e spans para emojis
const ALLOWED_ELEMENTS = [
  'p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'blockquote', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'del', 'sup', 'sub', 'span',
]

/** Separa texto em frases para renderizar como baloes individuais */
export function splitSentences(text: string): string[] {
  // Split por pontuacao final seguida de espaco
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

export function ChatBubble({ message, singleBubble, bubbleIndex, isAnalysing, nomeHeroi }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const { perfilAtivo } = useAuth()
  const hero = message.agente ? HEROES[message.agente as HeroId] : null
  const corHeroi = hero?.cor || '#6B7280'
  const profileColor = perfilAtivo?.cor || '#2563EB'

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

  const accentColor = hero?.accent || corHeroi
  const agentGradient = `linear-gradient(135deg, ${accentColor}0F, ${accentColor}1A)`

  // Modo singleBubble: renderiza como balão único durante reveal
  if (singleBubble) {
    const isFirst = bubbleIndex === 0
    return (
      <div className={`bubble-enter ${isFirst ? 'mb-1' : 'mb-1'}`}>
        <div className={`flex gap-2.5 items-start`}>
          {isFirst && (
            hero ? (
              <img
                src={hero.avatar}
                alt={hero.nome}
                className="w-8 h-8 object-cover shrink-0"
                style={{
                  borderRadius: '12px',
                  backgroundColor: `${accentColor}15`,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <img
                src="/logo-buble.png"
                alt="Super Agentes"
                className="w-8 h-8 object-cover shrink-0"
                style={{
                  borderRadius: '12px',
                  backgroundColor: `${accentColor}15`,
                }}
              />
            )
          )}
          <div
            className={`max-w-[80%] px-4 py-3 text-sm text-[var(--text-primary)] chat-bubble-content ${!isFirst ? 'ml-11' : ''}`}
            style={{
              background: agentGradient,
              borderRadius: isFirst ? '22px 22px 22px 6px' : '16px 22px 22px 16px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              allowedElements={ALLOWED_ELEMENTS}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  // Modo normal: split em frases (mensagem finalizada)
  const sentences = splitSentences(message.content)

  return (
    <div className="mb-3">
      {sentences.map((frase, i) => (
        <div key={i} className={`flex gap-2.5 items-start ${i > 0 ? 'mt-1' : ''}`}>
          {i === 0 && (
            hero ? (
              <img
                src={hero.avatar}
                alt={hero.nome}
                className="w-8 h-8 object-cover shrink-0"
                style={{
                  borderRadius: '12px',
                  backgroundColor: `${accentColor}15`,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <img
                src="/logo-buble.png"
                alt="Super Agentes"
                className="w-8 h-8 object-cover shrink-0"
                style={{
                  borderRadius: '12px',
                  backgroundColor: `${accentColor}15`,
                }}
              />
            )
          )}
          <div
            className={`max-w-[80%] px-4 py-3 text-sm text-[var(--text-primary)] chat-bubble-content ${i > 0 ? 'ml-11' : ''}`}
            style={{
              background: agentGradient,
              borderRadius: i === 0 ? '22px 22px 22px 6px' : '16px 22px 22px 16px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              allowedElements={ALLOWED_ELEMENTS}
            >
              {frase}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
