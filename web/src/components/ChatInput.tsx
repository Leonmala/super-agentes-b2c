import { useState, useRef, useEffect } from 'react'
import { Send, Plus } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'

export function ChatInput() {
  const [texto, setTexto] = useState('')
  const { enviar, streaming } = useChat()
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
