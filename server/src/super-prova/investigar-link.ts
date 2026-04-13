// server/src/super-prova/investigar-link.ts
// Hook 0 — Link Guardian: Gemini lê URL e retorna KB formatada para o herói
// Fail-silently: retorna null em qualquer falha (URL inacessível, erro Gemini, etc.)

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

/**
 * Investiga um link enviado pelo aluno e retorna uma knowledge base formatada.
 *
 * @param url     - URL enviada pelo aluno
 * @param contexto - Texto do aluno explicando o que quer estudar com o link
 * @param serie   - Série do aluno (ex: "7ano", "2em")
 * @param heroiId - Herói ativo na sessão (ex: "GAIA", "TEMPUS")
 * @returns       KB formatada como string, ou null em caso de falha
 */
export async function investigarLink(
  url: string,
  contexto: string,
  serie: string,
  heroiId: string
): Promise<string | null> {
  console.log(`[SuperProva:investigarLink] ─── HOOK 0 — investigação ───`)
  console.log(`[SuperProva:investigarLink] 🔗 URL: ${url} | herói: ${heroiId} | série: ${serie}`)
  console.log(`[SuperProva:investigarLink] 💬 Contexto do aluno: "${contexto.slice(0, 80)}"`)

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      // @ts-ignore — googleSearch não está no tipo oficial mas funciona na API
      tools: [{ googleSearch: {} }],
    })

    const prompt = `Você é um assistente pedagógico. O professor ${heroiId} precisa extrair o conteúdo do link abaixo para ajudar um aluno do ${serie}.

LINK: ${url}
INTENÇÃO DO ALUNO: "${contexto}"

Acesse o conteúdo do link e retorne um resumo pedagógico estruturado no seguinte formato exato (sem JSON, sem markdown, só texto plano):

CONTEÚDO DO LINK: ${url}
TEMA CENTRAL: [1 frase resumindo o assunto principal]
RESUMO: [3 a 5 parágrafos do conteúdo principal, adaptados para o ${serie}]
CONCEITOS-CHAVE: [lista dos termos e conceitos importantes separados por vírgula]
INTENÇÃO DO ALUNO: [o que o aluno quer estudar ou aprender com este conteúdo]

Se o link estiver inacessível ou não tiver conteúdo relevante, retorne apenas: ERRO_LINK_INACESSIVEL`

    const inicio = Date.now()
    const result = await model.generateContent(prompt)
    const texto = result.response.text().trim()
    const tempoMs = Date.now() - inicio

    if (!texto || texto === 'ERRO_LINK_INACESSIVEL') {
      console.warn(`[SuperProva:investigarLink] ⚠️ Link inacessível ou sem conteúdo: ${url}`)
      return null
    }

    console.log(`[SuperProva:investigarLink] ✅ KB gerada em ${tempoMs}ms | ${texto.length} chars`)
    return texto

  } catch (err) {
    console.error('[SuperProva:investigarLink] ❌ Falha ao investigar link (fail-silently):', err)
    return null
  }
}
