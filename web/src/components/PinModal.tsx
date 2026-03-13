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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">PIN do Responsável</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Digite seu PIN de 4 dígitos</p>

        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < digits.length ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {erro && (
          <p className="text-sm text-red-600 text-center mb-4">{erro}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {numpad.map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === '⌫') removeDigit()
                else if (key !== '') addDigit(key)
              }}
              disabled={loading || key === ''}
              className={`h-12 rounded-xl text-lg font-semibold transition-colors ${
                key === ''
                  ? 'invisible'
                  : key === '⌫'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300'
              } disabled:opacity-50`}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
