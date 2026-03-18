import { useState, useRef, useEffect } from 'react'
import { Send, Plus, X } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'
import { comprimirImagem } from '../utils/image-compress'

interface ImagemPendente {
  base64: string
  preview: string  // dataUrl para <img src>
}

export function ChatInput() {
  const [texto, setTexto] = useState('')
  const [imagemPendente, setImagemPendente] = useState<ImagemPendente | null>(null)
  const [erroImagem, setErroImagem] = useState<string | null>(null)
  const { enviar, streaming, heroiAtivo } = useChat()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [texto])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!e.target.files) return
    // Limpar input para permitir reselecionar o mesmo arquivo
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErroImagem('Selecione apenas imagens')
      return
    }

    try {
      const comprimida = await comprimirImagem(file)
      if (comprimida.tamanhoKB > 500) {
        setErroImagem(`Imagem muito grande (${comprimida.tamanhoKB}KB). Tente outra.`)
        return
      }
      setImagemPendente({ base64: comprimida.base64, preview: comprimida.dataUrl })
      setErroImagem(null)
    } catch {
      setErroImagem('Erro ao processar imagem')
    }
  }

  const handleSubmit = () => {
    const trimmed = texto.trim()
    // Permitir envio só com imagem (sem texto)
    if ((!trimmed && !imagemPendente) || streaming) return
    enviar(trimmed, undefined, imagemPendente?.base64)
    setTexto('')
    setImagemPendente(null)
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

  const getGradient = () => {
    if (heroiAtivo && HEROES[heroiAtivo as HeroId]) {
      const hero = HEROES[heroiAtivo as HeroId]
      return { from: hero.gradientFrom, to: hero.gradientTo }
    }
    return { from: '#2563EB', to: '#1E3A8A' }
  }

  const gradient = getGradient()

  return (
    <div className="px-3.5 py-2 pb-3.5 shrink-0">
      {/* Toast de erro de imagem */}
      {erroImagem && (
        <div className="max-w-2xl mx-auto mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-xs text-red-600">{erroImagem}</span>
          <button onClick={() => setErroImagem(null)} className="ml-2 text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Preview da imagem pendente */}
      {imagemPendente && (
        <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 px-1">
          <div className="relative">
            <img
              src={imagemPendente.preview}
              alt="Imagem a enviar"
              className="h-16 w-16 object-cover rounded-xl border border-gray-200"
            />
            <button
              onClick={() => setImagemPendente(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
              aria-label="Remover imagem"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Imagem selecionada</span>
        </div>
      )}

      <div
        className="flex items-end gap-2 bg-white rounded-[50px] p-1.5 pl-1.5 max-w-2xl mx-auto"
        style={{
          boxShadow: 'var(--shadow-float)',
          border: '1.5px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Botão "+" — abre file picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={streaming}
          className="w-10 h-10 rounded-full bg-[var(--bg-base)] text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors disabled:opacity-30"
          aria-label="Anexar imagem"
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

        {/* Botão enviar */}
        <button
          onClick={handleSubmit}
          disabled={(!texto.trim() && !imagemPendente) || streaming}
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-md hover:opacity-90 hover:scale-105 transition-all disabled:opacity-30"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
