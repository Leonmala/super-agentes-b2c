import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, HeroId } from '../types'
import { HEROES } from '../constants'
import { useAuth } from '../contexts/AuthContext'
import { StreamingCursor } from './StreamingCursor'

// Elementos permitidos — inclui tabelas e spans para emojis
const ALLOWED_ELEMENTS = [
  'p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'blockquote', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'del', 'sup', 'sub', 'span',
]

interface ChatBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  streamingText?: string
}

export function ChatBubble({ message, isStreaming, streamingText }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const { perfilAtivo } = useAuth()
  const hero = message.agente ? HEROES[message.agente as HeroId] : null
  const corHeroi = hero?.cor || '#6B7280'
  const profileColor = perfilAtivo?.cor || '#2563EB'

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-sm"
          style={{ backgroundColor: profileColor }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  const content = isStreaming ? (streamingText || '') : message.content

  // Cor do herói com opacidade para fundo do balão
  const bubbleBg = hero ? `${corHeroi}15` : '#F9FAFB'
  const bubbleBorder = hero ? `${corHeroi}40` : '#E5E7EB'

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
        <img src="/logo-buble.png" alt="Super Agentes" className="w-8 h-8 rounded-full object-cover shrink-0" />
      )}
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm chat-bubble-content"
        style={{ backgroundColor: bubbleBg, borderWidth: '1px', borderColor: bubbleBorder }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          allowedElements={ALLOWED_ELEMENTS}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && <StreamingCursor color={corHeroi} />}
      </div>
    </div>
  )
}
