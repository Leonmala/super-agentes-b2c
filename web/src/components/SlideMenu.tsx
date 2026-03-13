import { X, BookOpen, Bot, Eye, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { FILHO_COLORS } from '../constants'
import type { TipoInterface } from '../types'

interface SlideMenuProps {
  open: boolean
  onClose: () => void
}

export function SlideMenu({ open, onClose }: SlideMenuProps) {
  const { perfilAtivo, filhos, trocarPerfil, selectFilhoPai, logout } = useAuth()
  const { limpar } = useChat()
  const tipoInterface: TipoInterface = perfilAtivo?.tipoInterface || 'fundamental'
  const isPai = tipoInterface === 'pai'
  const profileColor = perfilAtivo?.cor || '#2563EB'

  const handleTrocarPerfil = () => {
    limpar()
    trocarPerfil()
    onClose()
  }

  const handleLogout = () => {
    limpar()
    logout()
    onClose()
  }

  // Professor IA: só para ensino médio e pai
  const showProfessorIA = tipoInterface === 'medio' || tipoInterface === 'pai'

  const menuItems = [
    { label: 'Super Agentes', icon: BookOpen, visible: true },
    { label: 'Professor de IA', icon: Bot, visible: showProfessorIA },
    { label: 'Supervisor', icon: Eye, visible: isPai },
  ].filter(item => item.visible)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: profileColor }}
      >
        <div className="flex flex-col h-full">
          {/* Header do menu */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Super Agentes" className="h-12 object-contain" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Menu items em cards brancos */}
          <nav className="flex-1 px-3 py-2 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-white/90 hover:bg-white shadow-sm"
                style={{ color: profileColor }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Seletor de filho ativo (modo pai) */}
          {isPai && filhos.length > 0 && (
            <div className="px-3 py-3">
              <div className="bg-white/90 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase mb-2 opacity-60" style={{ color: profileColor }}>
                  Filho ativo
                </p>
                <div className="space-y-1">
                  {filhos.map((filho, idx) => {
                    const isActive = perfilAtivo?.selectedFilhoId === filho.id
                    const filhoColor = FILHO_COLORS[idx % FILHO_COLORS.length]
                    return (
                      <button
                        key={filho.id}
                        onClick={() => { selectFilhoPai(filho.id); onClose() }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: filhoColor }}
                        >
                          {filho.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{filho.nome}</span>
                        {isActive && (
                          <span className="ml-auto text-xs font-bold" style={{ color: filhoColor }}>●</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Ações de rodapé em cards brancos */}
          <div className="px-3 py-3 space-y-2">
            <button
              onClick={handleTrocarPerfil}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white shadow-sm transition-colors"
              style={{ color: profileColor }}
            >
              <ArrowLeftRight size={18} />
              Trocar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
