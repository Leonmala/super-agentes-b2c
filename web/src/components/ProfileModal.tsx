import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { PinModal } from './PinModal'
import { FILHO_COLORS, PAI_COLOR } from '../constants'

export function ProfileModal() {
  const { filhos, responsavel, selectFilho, perfilAtivo } = useAuth()
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)

  if (perfilAtivo) return null

  const handleFilho = async (filhoId: string) => {
    setLoading(true)
    try {
      await selectFilho(filhoId)
    } catch {
      // handle error
    }
    setLoading(false)
  }

  if (showPin) {
    return <PinModal onCancel={() => setShowPin(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Quem está estudando?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Selecione o perfil</p>

        <div className="space-y-3">
          {filhos.map((filho, idx) => {
            const filhoColor = FILHO_COLORS[idx % FILHO_COLORS.length]
            return (
              <button
                key={filho.id}
                onClick={() => handleFilho(filho.id)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-50"
                style={{ backgroundColor: `${filhoColor}10` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: filhoColor }}
                >
                  {filho.nome.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{filho.nome}</p>
                  <p className="text-xs text-gray-500">{filho.serie}</p>
                </div>
              </button>
            )
          })}

          {responsavel && (
            <>
              <div className="border-t border-gray-200 my-2" />
              <button
                onClick={() => setShowPin(true)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-50"
                style={{ backgroundColor: `${PAI_COLOR}10` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: PAI_COLOR }}
                >
                  {responsavel.nome.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{responsavel.nome}</p>
                  <p className="text-xs text-gray-500">Responsável</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
