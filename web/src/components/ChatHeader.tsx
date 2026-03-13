import { Menu } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

interface ChatHeaderProps {
  onMenuToggle: () => void
}

export function ChatHeader({ onMenuToggle }: ChatHeaderProps) {
  const { heroiAtivo } = useChat()
  const { perfilAtivo } = useAuth()
  const hero = heroiAtivo ? HEROES[heroiAtivo as HeroId] : null
  const isPai = perfilAtivo?.tipoInterface === 'pai'

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
      <button
        onClick={onMenuToggle}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Menu"
      >
        <Menu size={22} className="text-gray-600" />
      </button>

      {hero ? (
        <>
          <img
            src={hero.avatar}
            alt={hero.nome}
            className="w-9 h-9 rounded-full object-cover transition-all duration-300"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{hero.nome}</p>
            <p className="text-xs text-gray-500 truncate">{hero.materia}</p>
          </div>
        </>
      ) : (
        <>
          <img src="/logo-buble.png" alt="Super Agentes" className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Super Agentes</p>
            <p className="text-xs text-gray-500">Pense-AI</p>
          </div>
        </>
      )}

      {isPai && (
        <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          MODO PAI
        </span>
      )}
    </header>
  )
}
