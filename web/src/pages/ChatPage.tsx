import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { ProfileModal } from '../components/ProfileModal'
import { ChatHeader } from '../components/ChatHeader'
import { ChatMessages } from '../components/ChatMessages'
import { ChatInput } from '../components/ChatInput'
import { SlideMenu } from '../components/SlideMenu'

export function ChatPage() {
  const { perfilAtivo } = useAuth()
  const { erro, limiteMsg, dismissErro, dismissLimite } = useChat()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)]">
      {!perfilAtivo && <ProfileModal />}

      <ChatHeader onMenuToggle={() => setMenuOpen(true)} />

      {/* Chat sheet overlaps header */}
      <div className="relative z-10 flex-1 flex flex-col bg-[var(--bg-base)] rounded-t-[28px] -mt-6 overflow-hidden">
        {/* Alert banners inside sheet */}
        {erro && (
          <div className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-[16px] flex items-center justify-between shrink-0">
            <p className="text-sm text-red-700">{erro}</p>
            <button onClick={dismissErro} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
          </div>
        )}
        {limiteMsg && (
          <div className="mx-4 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-[16px] flex items-center justify-between shrink-0">
            <p className="text-sm text-amber-700">{limiteMsg}</p>
            <button onClick={dismissLimite} className="text-amber-400 hover:text-amber-600 text-sm ml-2">✕</button>
          </div>
        )}

        <ChatMessages />
        <ChatInput />
      </div>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
