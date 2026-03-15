import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface PinModalProps {
  onCancel: () => void
}

export function PinModal({ onCancel }: PinModalProps) {
  const { selectPai } = useAuth()
  const [digits, setDigits] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const addDigit = useCallback((d: string) => {
    if (digits.length >= 4) return
    const next = [...digits, d]
    setDigits(next)
    setErro('')

    if (next.length === 4) {
      const pin = next.join('')
      setLoading(true)
      selectPai(pin).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'PIN inválido'
        setErro(msg)
        setDigits([])
        setLoading(false)
      })
    }
  }, [digits, selectPai])

  const removeDigit = useCallback(() => {
    setDigits(prev => prev.slice(0, -1))
    setErro('')
  }, [])

  const numpad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#172554] flex flex-col items-center justify-center">
      {/* Lock Avatar */}
      <div className="mb-8 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {/* Greeting */}
      <h1 className="text-white font-bold text-xl mb-2">Olá, Responsável</h1>

      {/* Subtitle */}
      <p className="text-white/60 text-sm mb-8">Digite seu PIN de 4 dígitos</p>

      {/* PIN Dots */}
      <div className="flex justify-center gap-3 mb-8">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < digits.length
                ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                : 'border-white/30'
            }`}
          />
        ))}
      </div>

      {/* Error Text */}
      {erro && (
        <p className="text-red-300 text-sm mb-6">{erro}</p>
      )}

      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-[14px] w-full max-w-[280px] mb-8 px-2">
        {numpad.map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === '⌫') removeDigit()
              else if (key !== '') addDigit(key)
            }}
            disabled={loading || key === ''}
            className={`transition-all duration-150 w-full aspect-[1.3] ${
              key === ''
                ? 'bg-transparent border-transparent cursor-default pointer-events-none'
                : key === '⌫'
                  ? 'bg-white/6 backdrop-blur-[16px] border border-white/12 rounded-[22px] text-white/60 text-base font-bold hover:bg-white/12 hover:text-white hover:scale-[1.04] active:bg-white/25 active:scale-[0.97] flex items-center justify-center'
                  : 'bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] text-white text-2xl font-bold hover:bg-white/18 hover:scale-[1.04] active:bg-white/25 active:scale-[0.97] flex items-center justify-center'
            } ${loading && key !== '' ? 'opacity-50' : ''}`}
          >
            {key === '⌫' ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Forgot PIN Link */}
      <button
        className="text-white/40 text-sm hover:text-white/60 transition-colors mb-6"
      >
        Esqueci meu PIN
      </button>

      {/* Back Button */}
      <button
        onClick={onCancel}
        className="text-white/50 hover:text-white/70 transition-colors text-sm mb-8"
      >
        ← Voltar
      </button>

      {/* Pense-AI Signature */}
      <div className="absolute bottom-5 right-5">
        <img
          src="/LogoPenseAI.png"
          alt="Pense-AI"
          className="h-10 opacity-80"
        />
      </div>
    </div>
  )
}
