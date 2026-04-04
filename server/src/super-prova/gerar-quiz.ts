// server/src/super-prova/gerar-quiz.ts
// Gera QuizQuestion[] baseado no tema da conversa atual via Gemini (sem grounding — conteúdo curricular)

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

export interface QuizQuestion {
  id: string
  pergunta: string
  opcoes: Array<{ valor: string; texto: string }>
  resposta: string[]    // valores corretos (ex: ["A"])
  explicacao: string
}

export interface QuizGerado {
  tema: string
  serie: string
  questoes: QuizQuestion[]
}

// Número de questões varia com a série: alunos mais velhos recebem quizzes maiores
function questoesPorSerie(serie: string): number {
  const s = serie.toLowerCase()
  if (s.includes('3_em'))                       return 20  // 3º EM
  if (s.includes('2_em') || s.includes('1_em')) return 18  // 1º-2º EM
  if (s.includes('9_fund') || s.includes('8_fund')) return 15  // 8º-9º ano
  if (s.includes('7_fund') || s.includes('6_fund')) return 12  // 6º-7º ano
  if (s.includes('5_fund') || s.includes('4_fund')) return 10  // 4º-5º ano
  return 8  // 1º-3º ano (padrão mínimo)
}

export async function gerarQuiz(
  tema: string,
  serie: string,
  materia: string,
  resumoConversa: string
): Promise<QuizGerado> {
  const nQuestoes = questoesPorSerie(serie)
  console.log(`[SuperProva:gerar-quiz] 🎯 Sinal QUIZ recebido | tema: "${tema}" | série: ${serie} | matéria: ${materia} | questões: ${nQuestoes}`)
  console.log(`[SuperProva:gerar-quiz] 📝 Resumo da conversa (${resumoConversa.length} chars)`)

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  })

  const prompt = `Crie um quiz educacional sobre "${tema}" para alunos do ${serie} (matéria: ${materia}).

Contexto da conversa que aconteceu: ${resumoConversa}

Gere exatamente ${nQuestoes} questões de múltipla escolha.

Retorne um JSON com este formato EXATO:
{
  "questoes": [
    {
      "id": "q1",
      "pergunta": "texto da pergunta",
      "opcoes": [
        {"valor": "A", "texto": "texto opção A"},
        {"valor": "B", "texto": "texto opção B"},
        {"valor": "C", "texto": "texto opção C"},
        {"valor": "D", "texto": "texto opção D"}
      ],
      "resposta": ["A"],
      "explicacao": "Explicação breve do porquê A é correto"
    }
  ]
}

Regras:
- ${nQuestoes} questões com dificuldade progressiva: primeiras questões fáceis (recordação e identificação), meio do quiz com nível médio (compreensão e aplicação), últimas questões difíceis (análise e síntese)
- 4 alternativas por questão, somente 1 resposta correta
- Explicação de 1-2 frases
- Linguagem adequada ao ${serie}
- Retorne SOMENTE o JSON`

  const inicioChamada = Date.now()
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const tempoMs = Date.now() - inicioChamada

  console.log(`[SuperProva:gerar-quiz] ✅ Gemini respondeu em ${tempoMs}ms`)

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`[SuperProva:gerar-quiz] ❌ JSON inválido. Raw: ${text.slice(0, 200)}`)
    throw new Error(`[SuperProva] JSON de quiz inválido para tema: ${tema}`)
  }

  const parsed = JSON.parse(jsonMatch[0]) as { questoes: QuizQuestion[] }
  const questoes = parsed.questoes ?? []

  console.log(`[SuperProva:gerar-quiz] 🃏 ${questoes.length} questões geradas — enviando SSE event 'quiz'`)

  return { tema, serie, questoes }
}
