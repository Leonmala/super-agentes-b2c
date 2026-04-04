// server/src/super-prova/consultar.ts
// Processa sinal CONSULTAR — consulta pontual via Gemini grounding

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

export interface ResultadoConsulta {
  query: string
  resposta: string
  fontes: string[]
}

export async function consultarKnowledgeBase(
  query: string,
  tema: string,
  serie: string,
  heroiId: string
): Promise<ResultadoConsulta> {
  console.log(`[SuperProva:consultar] 🔎 Sinal CONSULTAR recebido | herói: ${heroiId} | query: "${query}" | tema: "${tema}"`)

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // @ts-ignore
    tools: [{ googleSearch: {} }],
  })

  const prompt = `Você é um assistente pedagógico. O professor ${heroiId} está ensinando sobre "${tema}" para alunos do ${serie} e precisa de informação específica.

Consulta: "${query}"

Responda de forma rica, precisa e adequada ao ${serie}. Máximo 500 caracteres.
Inclua fatos concretos, datas ou dados verificados quando relevante.
Retorne apenas o texto da resposta (sem JSON).`

  const inicioChamada = Date.now()
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const tempoMs = Date.now() - inicioChamada

  console.log(`[SuperProva:consultar] ✅ Consulta respondida em ${tempoMs}ms | chars: ${text.trim().length}`)

  // Extrair fontes das grounding metadata se disponível
  const fontes: string[] = []
  try {
    const candidates = result.response.candidates ?? []
    for (const candidate of candidates) {
      const groundingMeta = (candidate as any).groundingMetadata
      if (groundingMeta?.webSearchQueries?.length) {
        console.log(`[SuperProva:consultar] 🔍 Buscas: ${groundingMeta.webSearchQueries.join(', ')}`)
        fontes.push(...groundingMeta.webSearchQueries)
      }
    }
  } catch {
    // fail-silently — fontes são opcionais
  }

  console.log(`[SuperProva:consultar] 📨 Resultado pronto para persistir na sessão`)

  return { query, resposta: text.trim(), fontes }
}
