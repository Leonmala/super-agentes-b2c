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

export async function gerarQuiz(
  tema: string,
  serie: string,
  materia: string,
  resumoConversa: string
): Promise<QuizGerado> {
  console.log(`[SuperProva:gerar-quiz] 🎯 Sinal QUIZ recebido | tema: "${tema}" | série: ${serie} | matéria: ${materia}`)
  console.log(`[SuperProva:gerar-quiz] 📝 Resumo da conversa (${resumoConversa.length} chars)`)

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  })

  const prompt = `Crie um quiz educacional sobre "${tema}" para alunos do ${serie} (matéria: ${materia}).

Contexto da conversa que aconteceu: ${resumoConversa}

Gere exatamente 4 questões de múltipla escolha.

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
- 4 questões, dificuldade progressiva (fácil → médio → médio → difícil)
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
