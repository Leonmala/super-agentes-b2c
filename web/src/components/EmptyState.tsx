import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'

interface EmptyContent {
  titulo: string
  subtitulo: string
  cta: string
}

// Textos para MODO FILHO
const EMPTY_FILHO: Record<string, EmptyContent> = {
  super_agentes: {
    titulo: 'Oi, {nome}!',
    subtitulo: 'Tenho 8 professores prontos para te ajudar.',
    cta: 'Sobre qual materia voce quer estudar hoje? So perguntar!',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar inteligencia artificial como ferramenta de estudo.',
    cta: 'Me diga o que voce quer fazer e eu te ensino a promptar!',
  },
}

// Textos para MODO PAI
const EMPTY_PAI: Record<string, EmptyContent> = {
  super_agentes: {
    titulo: 'Ola, {nome}!',
    subtitulo: 'Posso te ajudar a ensinar qualquer materia para seu filho.',
    cta: 'Qual materia voce quer trabalhar com seu filho hoje?',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar IA enquanto te ajudo a promptar.',
    cta: 'Me conte o que quer aprender e vamos juntos!',
  },
  supervisor: {
    titulo: 'Supervisor Educacional',
    subtitulo: 'Acompanhe o desenvolvimento do seu filho nos estudos.',
    cta: 'Pergunte sobre o progresso da semana ou peca um resumo!',
  },
}

export function EmptyState() {
  const { perfilAtivo } = useAuth()
  const { agenteMenu } = useChat()
  const nome = perfilAtivo?.nome || 'aluno'
  const isPai = perfilAtivo?.tipoUsuario === 'pai'

  const conteudos = isPai ? EMPTY_PAI : EMPTY_FILHO
  const content = conteudos[agenteMenu] || conteudos['super_agentes']

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <img
        src="/logo-buble.png"
        alt="Super Agentes Pense-AI"
        className="w-24 h-24 mb-4"
      />
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {content.titulo.replace('{nome}', nome)}
      </h2>
      <p className="text-gray-600 text-sm max-w-xs mb-1">
        {content.subtitulo}
      </p>
      <p className="text-gray-400 text-xs max-w-xs italic">
        {content.cta}
      </p>
    </div>
  )
}
