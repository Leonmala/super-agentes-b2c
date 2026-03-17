import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { FILHO_COLORS } from '../constants'
import type { TipoInterface } from '../types'

interface SlideMenuProps {
  open: boolean
  onClose: () => void
}

/* ─── SVG Icons (matching prototype exactly) ─── */

function IconBolt({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconMonitor({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconEye({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconLogout({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ─── Component ─── */

export function SlideMenu({ open, onClose }: SlideMenuProps) {
  const { perfilAtivo, filhos, trocarPerfil, selectFilhoPai, logout } = useAuth()
  const { limpar, agenteMenu, setAgenteMenu } = useChat()
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

  const menuItems: Array<{
    label: string
    icon: React.FC<{ size?: number }>
    visible: boolean
    agente: string
  }> = [
    { label: 'Super Agentes', icon: IconBolt, visible: true, agente: 'super_agentes' },
    { label: 'Professor de IA', icon: IconMonitor, visible: showProfessorIA, agente: 'professor_ia' },
    { label: 'Supervisor', icon: IconEye, visible: isPai, agente: 'supervisor' },
  ]

  const visibleItems = menuItems.filter(item => item.visible)

  // Cor mais escura para gradiente do pai
  const getDarkerColor = (hex: string): string => {
    if (isPai) return '#172554'
    return hex
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[4px] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel — 290px como protótipo */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[290px] overflow-hidden transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(160deg, ${profileColor}, ${getDarkerColor(profileColor)})`,
        }}
      >
        {/* Organic blobs */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full opacity-25 pointer-events-none"
          style={{
            top: '-30px',
            left: '-40px',
            filter: 'blur(50px)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)',
          }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full opacity-25 pointer-events-none"
          style={{
            bottom: '20px',
            right: '-50px',
            filter: 'blur(50px)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)',
          }}
        />

        {/* Content — padding 24px top/bottom, 18px sides */}
        <div className="relative flex flex-col h-full py-6 px-[18px]">

          {/* Top: Brand + Close */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-white font-extrabold text-[15px] tracking-[-0.3px]">Super Agentes</span>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-white/10 border border-white/8 rounded-[12px] hover:bg-white/20 transition-all text-white"
            >
              <IconClose />
            </button>
          </div>

          {/* Profile Card */}
          {perfilAtivo && (
            <div className="bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] px-[18px] py-4 mb-7">
              <div className="flex items-center gap-[14px]">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-base bg-white/15 shrink-0">
                  {perfilAtivo.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-[15px]">{perfilAtivo.nome}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {isPai ? 'Responsável' : `Aluno${perfilAtivo.tipoInterface === 'medio' ? ' · Ensino Médio' : ''}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section label */}
          <p className="text-[10px] uppercase tracking-[1.5px] text-white/30 font-bold mb-[10px] pl-1">
            Navegação
          </p>

          {/* Navigation items */}
          <nav className="flex-1 flex flex-col gap-[6px]">
            {visibleItems.map(item => {
              const isActive = agenteMenu === item.agente
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    limpar()
                    setAgenteMenu(item.agente)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-[14px] px-4 py-[14px] rounded-[16px] text-sm transition-all border text-left ${
                    isActive
                      ? 'bg-white/15 border-white/15 text-white font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.1)]'
                      : 'bg-white/6 border-white/6 text-white/70 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/15' : 'bg-white/8'
                  }`}>
                    <item.icon size={18} />
                  </div>
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Filho selector (pai mode) */}
          {isPai && filhos.length > 0 && (
            <div className="py-3">
              <div className="bg-white/8 border border-white/8 rounded-[16px] p-3">
                <p className="text-[10px] uppercase tracking-[1.5px] text-white/30 font-bold mb-2 pl-1">Filho ativo</p>
                <div className="space-y-1">
                  {filhos.map((filho, idx) => {
                    const isActive = perfilAtivo?.selectedFilhoId === filho.id
                    return (
                      <button
                        key={filho.id}
                        onClick={() => { selectFilhoPai(filho.id); onClose() }}
                        className={`w-full flex items-center gap-3 rounded-[12px] p-2 transition-colors ${
                          isActive ? 'bg-white/8' : 'hover:bg-white/8'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: FILHO_COLORS[idx % FILHO_COLORS.length] }}
                        >
                          {filho.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white/80 text-sm text-left">{filho.nome}</span>
                        {isActive && (
                          <span className="ml-auto text-white text-xs font-bold">●</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom section */}
          <div className="mt-auto pt-5 border-t border-white/8 flex flex-col gap-1">
            {/* Trocar perfil */}
            <button
              onClick={handleTrocarPerfil}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13px] font-medium text-white/45 hover:bg-white/6 hover:text-white/70 transition-all"
            >
              <IconUser size={16} />
              Trocar perfil
            </button>

            {/* Sair */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13px] font-medium text-white/45 hover:bg-white/6 hover:text-white/70 transition-all"
            >
              <IconLogout size={16} />
              Sair
            </button>

            {/* Logo Pense-AI — colorido, primeiro plano */}
            <div className="flex justify-end pt-3 relative z-10">
              <img
                src="/LogoPenseAI.png"
                alt="Pense-AI"
                className="h-10"
              />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
