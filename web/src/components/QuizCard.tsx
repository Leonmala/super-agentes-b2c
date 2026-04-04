// web/src/components/QuizCard.tsx
// Componente de quiz — renderizado quando servidor emite SSE event 'quiz'
import { useState } from 'react'

export interface QuizQuestion {
  id: string
  pergunta: string
  opcoes: Array<{ valor: string; texto: string }>
  resposta: string[]
  explicacao: string
}

export interface QuizGerado {
  tema: string
  serie: string
  questoes: QuizQuestion[]
}

interface QuizCardProps {
  quiz: QuizGerado
  onFechar: () => void
}

export function QuizCard({ quiz, onFechar }: QuizCardProps) {
  const { tema, questoes } = quiz
  const [atual, setAtual] = useState(0)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [pontos, setPontos] = useState(0)
  const [finalizado, setFinalizado] = useState(false)

  const questao = questoes[atual]
  const isCorreta = selecionada !== null && questao.resposta.includes(selecionada)

  function confirmar() {
    if (!selecionada) return
    if (isCorreta) setPontos(p => p + 1)
    setMostrarGabarito(true)
  }

  function proxima() {
    if (atual + 1 >= questoes.length) {
      setFinalizado(true)
    } else {
      setAtual(a => a + 1)
      setSelecionada(null)
      setMostrarGabarito(false)
    }
  }

  // ─── Tela de resultado final ───────────────────────────────────────────────
  if (finalizado) {
    const pct = Math.round((pontos / questoes.length) * 100)
    const emoji = pct >= 75 ? '🎉' : pct >= 50 ? '👍' : '📖'
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-3">{emoji}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Quiz concluído!</h3>
          <p className="text-sm text-gray-500 mb-4">{tema}</p>
          <p className="text-4xl font-bold text-emerald-600 mb-1">
            {pontos}/{questoes.length}
          </p>
          <p className="text-sm text-gray-500 mb-6">{pct}% de acertos</p>
          <button
            onClick={onFechar}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Continuar estudando
          </button>
        </div>
      </div>
    )
  }

  // ─── Questão atual ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {atual + 1} / {questoes.length}
            </span>
            <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all"
                style={{ width: `${((atual + 1) / questoes.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 text-2xl ml-3 leading-none"
            aria-label="Fechar quiz"
          >
            ×
          </button>
        </div>

        {/* Tema */}
        <p className="text-xs text-blue-500 font-medium mb-2">{tema}</p>

        {/* Pergunta */}
        <p className="text-gray-800 font-semibold text-sm mb-4 leading-snug">
          {questao.pergunta}
        </p>

        {/* Opções */}
        <div className="space-y-2 mb-4">
          {questao.opcoes.map(opcao => {
            let estilo = 'border-2 border-gray-200 text-gray-700 hover:border-blue-300'

            if (mostrarGabarito) {
              if (questao.resposta.includes(opcao.valor)) {
                // resposta correta — sempre verde
                estilo = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800'
              } else if (selecionada === opcao.valor) {
                // seleção errada — vermelho
                estilo = 'border-2 border-red-400 bg-red-50 text-red-700'
              } else {
                estilo = 'border-2 border-gray-100 text-gray-400'
              }
            } else if (selecionada === opcao.valor) {
              estilo = 'border-2 border-blue-500 bg-blue-50 text-blue-800'
            }

            return (
              <button
                key={opcao.valor}
                disabled={mostrarGabarito}
                onClick={() => setSelecionada(opcao.valor)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all ${estilo}`}
              >
                <span className="font-bold mr-2">{opcao.valor}.</span>
                {opcao.texto}
              </button>
            )
          })}
        </div>

        {/* Explicação (após revelar gabarito) */}
        {mostrarGabarito && (
          <div
            className={`p-3 rounded-xl text-sm mb-4 ${
              isCorreta
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            <span className="font-semibold mr-1">
              {isCorreta ? '✅ Correto!' : '📖 Quase!'}
            </span>
            {questao.explicacao}
          </div>
        )}

        {/* Botão principal */}
        {!mostrarGabarito ? (
          <button
            onClick={confirmar}
            disabled={!selecionada}
            className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold transition-colors hover:bg-blue-700"
          >
            Confirmar
          </button>
        ) : (
          <button
            onClick={proxima}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {atual + 1 >= questoes.length ? 'Ver resultado →' : 'Próxima →'}
          </button>
        )}
      </div>
    </div>
  )
}
