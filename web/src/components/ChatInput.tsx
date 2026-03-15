import { useState, useRef, useEffect } from 'react'
import { Send, Plus } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

export function ChatInput() {
  const [texto, setTexto] = useState('')
  const { enviar, streaming, heroiAtivo } = useChat()
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  // Get hero gradient or fallback to institutional blue
  const getGradient = () => {
    if (heroiAtivo && HEROES[heroiAtivo as HeroId]) {
      const hero = HEROES[heroiAtivo as HeroId]
      return {
        from: hero.gradientFrom,
        to: hero.gradientTo,
      }
    }
    return {
      from: '#2563EB',
      to: '#1E3A8A',
    }
  }

  const gradient = getGradient()

  return (
    <div className="px-3.5 py-2 pb-3.5 shrink-0">
      <div
        className="flex items-end gap-2 bg-white rounded-[50px] p-1.5 pl-1.5 max-w-2xl mx-auto"
        style={{
          boxShadow: 'var(--shadow-float)',
          border: '1.5px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* Attach button */}
        <button
          className="w-10 h-10 rounded-full bg-[var(--bg-base)] text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors"
          aria-label="Anexar"
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

        {/* Send button with hero gradient */}
        <button
          onClick={handleSubmit}
          disabled={!texto.trim() || streaming}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          }}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-md hover:opacity-90 hover:scale-105 transition-all disabled:opacity-30"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
