import { useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { ChatBubble, splitSentences } from './ChatBubble'
import { TypingDots } from './TypingDots'
import { EmptyState } from './EmptyState'
import { useBubbleReveal } from '../hooks/useBubbleReveal'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

export function ChatMessages() {
  const {
    mensagens, streaming, pendingReveal, heroiAtivo,
    addMessage, clearPendingReveal,
  } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const reveal = useBubbleReveal()

  // Quando pendingReveal chega, iniciar revelação balão por balão
  useEffect(() => {
    if (pendingReveal) {
      const sentences = splitSentences(pendingReveal.content)
      reveal.startReveal(sentences)
    }
  }, [pendingReveal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quando revelação termina, finalizar mensagem
  useEffect(() => {
    if (pendingReveal && !reveal.isRevealing && reveal.visibleBubbles.length > 0) {
      addMessage(pendingReveal)
      clearPendingReveal()
      reveal.reset()
    }
  }, [reveal.isRevealing, reveal.visibleBubbles.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, reveal.visibleBubbles.length, reveal.showDots, streaming])

  const isActive = streaming || reveal.isRevealing || pendingReveal !== null
  if (mensagens.length === 0 && !isActive) {
    return <EmptyState />
  }

  const hero = heroiAtivo ? HEROES[heroiAtivo as HeroId] : null
  const dotsColor = hero?.cor || '#6B7280'

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Mensagens finalizadas */}
      {mensagens.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}

      {/* Balões sendo revelados (bubble by bubble) */}
      {reveal.visibleBubbles.map((frase, i) => (
        <ChatBubble
          key={`reveal-${i}`}
          message={{
            id: `reveal-${i}`,
            role: 'agent',
            content: frase,
            agente: pendingReveal?.agente,
            timestamp: Date.now(),
          }}
          singleBubble
          bubbleIndex={i}
        />
      ))}

      {/* Typing dots — durante streaming OU entre balões */}
      {(streaming || reveal.showDots) && (
        <div className="flex gap-2.5 items-start mb-3">
          {hero ? (
            <img
              src={hero.avatar}
              alt={hero.nome}
              className="w-8 h-8 object-cover shrink-0"
              style={{
                borderRadius: '12px',
                backgroundColor: `${hero.accent || hero.cor}15`,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <img
              src="/logo-buble.png"
              alt="Super Agentes"
              className="w-8 h-8 object-cover shrink-0"
              style={{ borderRadius: '12px', backgroundColor: '#6B728015' }}
            />
          )}
          <div
            className="px-4 py-2 text-sm"
            style={{
              background: `linear-gradient(135deg, ${dotsColor}0F, ${dotsColor}1A)`,
              borderRadius: '22px 22px 22px 6px',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <TypingDots color={dotsColor} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
