import { X, BookOpen, Bot, Eye, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
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

  const menuItems = [
    { label: 'Super Agentes', icon: BookOpen, always: true },
    { label: 'Professor de IA', icon: Bot, always: true },
    ...(isPai ? [
      { label: 'Supervisor', icon: Eye, always: false },
    ] : []),
  ]

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo-buble.png" alt="Super Agentes" className="w-8 h-8 rounded-lg" />
              <span className="font-semibold text-gray-900 text-sm">Super Agentes</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <item.icon size={18} className="text-gray-500" />
                {item.label}
              </button>
            ))}
          </nav>

          {isPai && filhos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Filho ativo</p>
              <div className="space-y-1">
                {filhos.map(filho => {
                  const isActive = perfilAtivo?.selectedFilhoId === filho.id
                  return (
                    <button
                      key={filho.id}
                      onClick={() => { selectFilhoPai(filho.id); onClose() }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {filho.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{filho.nome}</span>
                      {isActive && <span className="ml-auto text-xs text-blue-600">●</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="px-3 py-3 border-t border-gray-200 space-y-1">
            <button
              onClick={handleTrocarPerfil}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftRight size={18} className="text-gray-400" />
              Trocar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={18} className="text-red-400" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
