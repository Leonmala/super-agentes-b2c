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
    <div className="h-screen flex flex-col bg-gray-50">
      {!perfilAtivo && <ProfileModal />}

      {erro && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shrink-0">
          <p className="text-sm text-red-700">{erro}</p>
          <button onClick={dismissErro} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
        </div>
      )}
      {limiteMsg && (
        <div className="mx-4 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shrink-0">
          <p className="text-sm text-amber-700">{limiteMsg}</p>
          <button onClick={dismissLimite} className="text-amber-400 hover:text-amber-600 text-sm ml-2">✕</button>
        </div>
      )}

      <ChatHeader onMenuToggle={() => setMenuOpen(true)} />
      <ChatMessages />
      <ChatInput />

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
