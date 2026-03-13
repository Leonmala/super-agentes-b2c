import { useAuth } from '../contexts/AuthContext'

export function EmptyState() {
  const { perfilAtivo } = useAuth()
  const nome = perfilAtivo?.nome || 'aluno'

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <img
        src="/logo-buble.png"
        alt="Super Agentes Pense-AI"
        className="w-24 h-24 mb-4"
      />
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Olá, {nome}!
      </h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Sobre qual matéria você quer estudar hoje? É só perguntar!
      </p>
    </div>
  )
}
