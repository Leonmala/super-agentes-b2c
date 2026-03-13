import { useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { ChatBubble } from './ChatBubble'
import { EmptyState } from './EmptyState'
import type { ChatMessage } from '../types'

export function ChatMessages() {
  const { mensagens, streaming, streamingText, heroiAtivo } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, streamingText])

  if (mensagens.length === 0 && !streaming) {
    return <EmptyState />
  }

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
