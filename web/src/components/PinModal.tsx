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
          className="w-10 h-10 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
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
                ? 'bg-white border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
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
      <div className="grid grid-cols-3 gap-3.5 max-w-[260px] mb-8">
        {numpad.map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === '⌫') removeDigit()
              else if (key !== '') addDigit(key)
            }}
            disabled={loading || key === ''}
            className={`transition-all duration-150 ${
              key === ''
                ? 'invisible'
                : key === '⌫'
                  ? 'h-[62px] bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] text-white text-2xl font-bold hover:bg-white/18 hover:scale-[1.04] active:bg-white/25 active:scale-[0.97] flex items-center justify-center'
                  : 'h-[62px] bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] text-white text-2xl font-bold hover:bg-white/18 hover:scale-[1.04] active:bg-white/25 active:scale-[0.97] flex items-center justify-center'
            } ${loading && key !== '' ? 'opacity-50' : ''}`}
          >
            {key === '⌫' ? (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
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
          src="/logo-penseai.png"
          alt="Pense-AI"
          className="h-4 opacity-35 brightness-0 invert"
        />
      </div>
    </div>
  )
}
