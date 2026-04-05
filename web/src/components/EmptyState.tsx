import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { HEROES } from '../constants'
import type { HeroId } from '../types'

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
    cta: 'Pode digitar sua dúvida aqui embaixo, ou toca numa matéria para começar.',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar inteligência artificial como ferramenta de estudo.',
    cta: 'Me diga o que você quer fazer e eu te ensino a promptar!',
  },
}

// Textos para MODO PAI
const EMPTY_PAI: Record<string, EmptyContent> = {
  super_agentes: {
    titulo: 'Olá, {nome}!',
    subtitulo: 'Posso te ajudar a ensinar qualquer matéria para seu filho.',
    cta: 'Pode digitar uma dúvida ou escolha a matéria diretamente.',
  },
  professor_ia: {
    titulo: 'Professor de IA',
    subtitulo: 'Aprenda a usar IA enquanto te ajudo a promptar.',
    cta: 'Me conte o que quer aprender e vamos juntos!',
  },
  supervisor: {
    titulo: 'Supervisor Educacional',
    subtitulo: 'Acompanhe o desenvolvimento do seu filho nos estudos.',
    cta: 'Pergunte sobre o progresso da semana ou peça um resumo!',
  },
}

// Mapeamento matéria → mensagem enviada ao backend + nome do herói (para storytelling)
const MATERIA_CONFIG: Record<string, { mensagem: string; heroNome: string }> = {
  'Matemática': { mensagem: 'Ativar Matemática',  heroNome: 'Cálculus' },
  'Português':  { mensagem: 'Ativar Português',   heroNome: 'Verbetta' },
  'Ciências':   { mensagem: 'Ativar Ciências',    heroNome: 'Neuron'   },
  'História':   { mensagem: 'Ativar História',    heroNome: 'Tempus'   },
  'Geografia':  { mensagem: 'Ativar Geografia',   heroNome: 'Gaia'     },
  'Física':     { mensagem: 'Ativar Física',      heroNome: 'Vector'   },
  'Química':    { mensagem: 'Ativar Química',     heroNome: 'Alka'     },
  'Idiomas':    { mensagem: 'Ativar Idiomas',     heroNome: 'Flex'     },
}

const MATERIAS = Object.keys(MATERIA_CONFIG)

export function EmptyState() {
  const { perfilAtivo } = useAuth()
  const { agenteMenu, heroiAtivo, enviar } = useChat()
  const nome = perfilAtivo?.nome || 'aluno'
  const isPai = perfilAtivo?.tipoUsuario === 'pai'

  const conteudos = isPai ? EMPTY_PAI : EMPTY_FILHO
  const content = conteudos[agenteMenu] || conteudos['super_agentes']

  // Get hero data if active
  const heroData = heroiAtivo ? HEROES[heroiAtivo as HeroId] : null
  const avatarSrc = heroData?.avatar || '/logo-buble.png'
  const accentColor = heroData?.accent || '#3B6BA8'

  const handleMateriaClick = (materia: string) => {
    const config = MATERIA_CONFIG[materia]
    if (!config) return

    // Disparar envio → adiciona user bubble + seta streaming=true → TypingDots automáticos
    void enviar(config.mensagem)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Avatar container with glow background */}
      <div className="relative mb-5">
        {/* Subtle radial accent glow */}
        <div
          className="absolute w-24 h-24 rounded-full opacity-15 blur-2xl"
          style={{
            backgroundColor: accentColor,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Avatar background tint */}
        <div
          className="absolute inset-0 rounded-[26px]"
          style={{ backgroundColor: `${accentColor}20` }}
        />

        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt="Avatar"
          className="relative w-[88px] h-[88px] rounded-[26px] object-cover shadow-lg"
        />
      </div>

      {/* Greeting */}
      <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
        {content.titulo.replace('{nome}', nome)}
      </h2>

      {/* Description */}
      <p className="text-[14.5px] text-[var(--text-secondary)] max-w-[280px] mb-1">
        {content.subtitulo}
      </p>

      {/* CTA */}
      <p className="text-xs text-[var(--text-muted)] max-w-[280px] italic mb-6">
        {content.cta}
      </p>

      {/* Subject buttons — only when agenteMenu === 'super_agentes' */}
      {agenteMenu === 'super_agentes' && (
        <div className="flex flex-wrap justify-center gap-3 max-w-[340px]">
          {MATERIAS.map((materia) => (
            <button
              key={materia}
              onClick={() => handleMateriaClick(materia)}
              className="px-5 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                color: '#92400E',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              {materia}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
