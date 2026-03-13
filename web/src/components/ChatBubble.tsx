import ReactMarkdown from 'react-markdown'
import type { ChatMessage, HeroId } from '../types'
import { HEROES } from '../constants'
import { StreamingCursor } from './StreamingCursor'

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
        <img src="/logo-buble.png" alt="Super Agentes" className="w-8 h-8 rounded-full object-cover shrink-0" />
      )}
      <div className="max-w-[80%] bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm">
        <ReactMarkdown allowedElements={ALLOWED_ELEMENTS}>{content}</ReactMarkdown>
        {isStreaming && <StreamingCursor color={corHeroi} />}
      </div>
    </div>
  )
}
