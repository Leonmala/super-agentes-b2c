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

  const menuItems = [
    { label: 'Super Agentes', icon: BookOpen, visible: true, agente: 'super_agentes' },
    { label: 'Professor de IA', icon: Bot, visible: showProfessorIA, agente: 'professor_ia' },
    { label: 'Supervisor', icon: Eye, visible: isPai, agente: 'supervisor' },
  ].filter(item => item.visible)

  // Calcular cor mais escura para o gradiente
  const getDarkerColor = (hex: string): string => {
    if (isPai) return '#172554'
    // Reduzir brilho de filhos (usar profileColor com opacity no gradient)
    return hex
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[4px] transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(160deg, ${profileColor}, ${getDarkerColor(profileColor)})`,
        }}
      >
        {/* Organic blobs */}
        <div className="absolute top-10 right-12 w-80 h-80 rounded-full blur-[50px] opacity-25 pointer-events-none"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }} />
        <div className="absolute bottom-20 -left-32 w-96 h-96 rounded-full blur-[50px] opacity-25 pointer-events-none"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }} />

        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-white font-bold text-lg">Super Agentes</span>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-[12px] hover:bg-white/20 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* User card */}
          {perfilAtivo && (
            <div className="px-4 pb-3">
              <div className="bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-white/20">
                    {perfilAtivo.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{perfilAtivo.nome}</p>
                    <p className="text-white/60 text-xs">
                      {isPai ? 'Responsável' : `Aluno${perfilAtivo.tipoInterface === 'medio' ? ' — Ensino Médio' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation section */}
          <div className="px-4 mt-1 mb-2">
            <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-1">Navegação</p>
          </div>

          {/* Menu items */}
          <nav className="flex-1 px-3 py-2 space-y-2">
            {menuItems.map(item => {
              const isActive = agenteMenu === item.agente
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    limpar()
                    setAgenteMenu(item.agente)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm transition-colors border ${
                    isActive
                      ? 'bg-white/15 border-white/15 text-white font-semibold shadow-lg'
                      : 'bg-white/6 border-white/6 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-[10px] bg-white/10 flex items-center justify-center">
                    <item.icon size={18} />
                  </div>
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Filho selector (pai mode) */}
          {isPai && filhos.length > 0 && (
            <div className="px-3 py-3">
              <div className="bg-white/8 border border-white/8 rounded-[16px] p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">Filho ativo</p>
                <div className="space-y-1">
                  {filhos.map((filho, idx) => {
                    const isActive = perfilAtivo?.selectedFilhoId === filho.id
                    return (
                      <button
                        key={filho.id}
                        onClick={() => { selectFilhoPai(filho.id); onClose() }}
                        className={`w-full flex items-center gap-2 rounded-[12px] p-2 transition-colors ${
                          isActive ? 'bg-white/8' : 'hover:bg-white/8'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: FILHO_COLORS[idx % FILHO_COLORS.length] }}
                        >
                          {filho.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white/80 text-sm">{filho.nome}</span>
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

          {/* Footer actions */}
          <div className="px-3 py-3 space-y-2 border-t border-white/10">
            <button
              onClick={handleTrocarPerfil}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm bg-white/8 border border-white/8 text-white/70 hover:bg-white/12 transition-colors"
            >
              <ArrowLeftRight size={18} />
              Trocar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm bg-white/6 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
            >
              <X size={18} />
              Sair
            </button>
            {/* Pense-AI logo */}
            <div className="flex justify-end pt-2">
              <img
                src="/logo-penseai.png"
                alt="Pense-AI"
                className="h-4 opacity-30 brightness-0 invert"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
