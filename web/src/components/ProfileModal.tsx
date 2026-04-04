import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { PinModal } from './PinModal'
import { FILHO_COLORS, formatarSerie } from '../constants'

export function ProfileModal() {
  const { filhos, responsavel, selectFilho, perfilAtivo } = useAuth()
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  if (perfilAtivo) return null

  const handleFilho = async (filhoId: string) => {
    setLoading(true)
    setErro('')
    try {
      await selectFilho(filhoId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.'
      setErro(msg)
    }
    setLoading(false)
  }

  if (showPin) {
    return <PinModal onCancel={() => setShowPin(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#172554]">
      {/* Organic blob */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Container centrado */}
      <div className="relative h-full flex flex-col items-center justify-center px-6">
        {/* Conteúdo */}
        <div className="w-full max-w-sm">
          {/* Títulos */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Quem vai estudar?</h1>
            <p className="text-sm text-white/60">Selecione o perfil para começar</p>
          </div>

          {/* Erro */}
          {erro && (
            <p className="text-red-300 text-sm text-center mb-4">{erro}</p>
          )}

          {/* Cards dos filhos */}
          <div className="space-y-3 mb-6">
            {filhos.map((filho, idx) => {
              const filhoColor = FILHO_COLORS[idx % FILHO_COLORS.length]
              return (
                <button
                  key={filho.id}
                  onClick={() => handleFilho(filho.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-[22px] bg-white/12 backdrop-blur-[30px] border border-white/16 transition-all duration-200 hover:bg-white/18 hover:transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar com gradiente */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${filhoColor}, ${filhoColor}cc)`,
                      }}
                    >
                      {filho.nome.charAt(0).toUpperCase()}
                    </div>
                    {/* Nome e série */}
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">{filho.nome}</p>
                      <p className="text-xs text-white/60">{formatarSerie(filho.serie)}</p>
                    </div>
                  </div>
                  {/* Chevron */}
                  <svg
                    className="w-5 h-5 text-white/30 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )
            })}
          </div>

          {/* Separator com rótulo */}
          {responsavel && (
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-white/15" />
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                Responsável
              </span>
              <div className="flex-1 border-t border-white/15" />
            </div>
          )}

          {/* Card do responsável */}
          {responsavel && (
            <button
              onClick={() => setShowPin(true)}
              disabled={loading}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-[22px] bg-white/12 backdrop-blur-[30px] border border-white/16 transition-all duration-200 hover:bg-white/18 hover:transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {/* Avatar com ícone de cadeado */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-blue-400 to-blue-600">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                {/* Nome e role */}
                <div className="text-left">
                  <p className="font-semibold text-white text-sm">{responsavel.nome}</p>
                  <p className="text-xs text-white/60">Responsável</p>
                </div>
              </div>
              {/* Chevron */}
              <svg
                className="w-5 h-5 text-white/30 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Pense-AI signature */}
        <div className="absolute bottom-5 right-5">
          <img
            src="/LogoPenseAI.png"
            alt="Pense-AI"
            className="h-10 opacity-80"
          />
        </div>
      </div>
    </div>
  )
}
