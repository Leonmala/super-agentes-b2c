import { Menu } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { HEROES, AGENTES_ESPECIAIS } from '../constants'
import type { HeroId } from '../types'

interface ChatHeaderProps {
  onMenuToggle: () => void
}

export function ChatHeader({ onMenuToggle }: ChatHeaderProps) {
  const { heroiAtivo, agenteMenu } = useChat()
  const { perfilAtivo } = useAuth()

  // Prioridade: (1) agente especial selecionado no menu, (2) herói ativo (SSE), (3) defaults
  const especial = agenteMenu !== 'super_agentes' ? AGENTES_ESPECIAIS[agenteMenu] : null
  const hero = !especial && heroiAtivo ? HEROES[heroiAtivo as HeroId] : null

  const gradientFrom = especial?.gradientFrom || hero?.gradientFrom || '#2563EB'
  const gradientTo = especial?.gradientTo || hero?.gradientTo || '#1E3A8A'
  const bgImage = hero?.bgImage || null   // agentes especiais não têm bgImage
  const avatar = especial?.avatar || hero?.avatar || '/logo-super-agentes.png'
  const nome = especial?.nome || hero?.nome || 'Super Agentes'
  const materia = especial?.materia || hero?.materia || ''

  return (
    <header className="relative overflow-hidden shrink-0">
      {/* Layer 1: Hero gradient */}
      <div
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        className="absolute inset-0"
      />

      {/* Layer 2: bg-chat image overlay */}
      {bgImage && (
        <div
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          className="absolute inset-0 opacity-25"
        />
      )}

      {/* Layer 3: Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/10" />

      {/* Layer 4: Content */}
      <div className="relative z-10 flex items-center gap-3.5 px-5 pt-4 pb-10">
        <button
          onClick={onMenuToggle}
          className="w-10 h-10 flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/12 rounded-[12px] hover:bg-white/25 transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} className="text-white" />
        </button>

        <img
          src={avatar}
          alt={nome}
          className="w-[46px] h-[46px] rounded-[16px] border-2 border-white/25 object-cover shadow-lg"
        />

        <div className="min-w-0 flex-1">
          <p
            className="text-white font-bold text-base truncate"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {nome}
          </p>
          <p className="text-white/70 text-xs truncate">{materia}</p>
        </div>

        {perfilAtivo?.tipoUsuario === 'pai' && (
          <span className="text-xs font-semibold text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            MODO PAI
          </span>
        )}
      </div>
    </header>
  )
}
