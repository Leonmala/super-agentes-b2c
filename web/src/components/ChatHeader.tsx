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
  const profileColor = perfilAtivo?.cor || '#2563EB'

  return (
    <header
      className="px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm"
      style={{ backgroundColor: profileColor }}
    >
      <button
        onClick={onMenuToggle}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Menu"
      >
        <Menu size={22} className="text-white" />
      </button>

      {hero ? (
        <>
          <img
            src={hero.avatar}
            alt={hero.nome}
            className="w-9 h-9 rounded-full object-cover border-2 border-white/40 transition-all duration-300"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{hero.nome}</p>
            <p className="text-xs text-white/70 truncate">{hero.materia}</p>
          </div>
        </>
      ) : (
        <>
          <img src="/logo.png" alt="Super Agentes" className="h-8 object-contain shrink-0" />
        </>
      )}

      {perfilAtivo?.tipoUsuario === 'pai' && (
        <span className="ml-auto text-xs font-semibold text-white bg-white/20 px-2 py-1 rounded-full">
          MODO PAI
        </span>
      )}
    </header>
  )
}
