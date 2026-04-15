// server/src/super-prova/investigar-link.ts
// Hook 0 — Link Guardian: faz fetch direto do URL, extrai texto, resume via Gemini
// Fail-silently: retorna null em qualquer falha (URL inacessível, erro Gemini, etc.)

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

const FETCH_TIMEOUT_MS = 10_000
const MAX_CHARS = 8_000

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Investiga um link enviado pelo aluno e retorna uma knowledge base formatada.
 * Faz fetch direto do URL (não usa Google Search).
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

  // ── Fase 1: fetch do URL ──────────────────────────────────────────────────
  let textoExtraido: string
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SuperAgentes-Educacional/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    }).finally(() => clearTimeout(timer))

    if (!resp.ok) {
      console.warn(`[SuperProva:investigarLink] ⚠️ HTTP ${resp.status} para ${url}`)
      return null
    }

    const contentType = resp.headers.get('content-type') ?? ''
    if (!contentType.includes('html') && !contentType.includes('text')) {
      console.warn(`[SuperProva:investigarLink] ⚠️ Content-Type inesperado: ${contentType}`)
      return null
    }

    const html = await resp.text()
    textoExtraido = stripHtml(html).slice(0, MAX_CHARS)

    if (textoExtraido.length < 100) {
      console.warn(`[SuperProva:investigarLink] ⚠️ Conteúdo extraído muito curto (${textoExtraido.length} chars)`)
      return null
    }

    console.log(`[SuperProva:investigarLink] 📄 Texto extraído: ${textoExtraido.length} chars`)
  } catch (err) {
    console.warn(`[SuperProva:investigarLink] ⚠️ Falha no fetch (timeout ou bloqueio): ${url}`, err)
    return null
  }

  // ── Fase 2: Gemini resume o conteúdo extraído ─────────────────────────────
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    })

    const prompt = `Você é um assistente pedagógico. O professor ${heroiId} precisa de um resumo do conteúdo abaixo para ajudar um aluno do ${serie}.

INTENÇÃO DO ALUNO: "${contexto}"
URL ORIGINAL: ${url}

CONTEÚDO EXTRAÍDO DO SITE:
${textoExtraido}

Retorne um resumo pedagógico no seguinte formato exato (sem JSON, sem markdown, só texto plano):

CONTEÚDO DO LINK: ${url}
TEMA CENTRAL: [1 frase resumindo o assunto principal]
RESUMO: [3 a 5 parágrafos do conteúdo principal, adaptados para o ${serie}]
CONCEITOS-CHAVE: [lista dos termos e conceitos importantes separados por vírgula]
INTENÇÃO DO ALUNO: [o que o aluno quer estudar ou aprender com este conteúdo]

Se o conteúdo não for relevante ou não tiver informação suficiente, retorne apenas: ERRO_LINK_INACESSIVEL`

    const inicio = Date.now()
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        // @ts-ignore — thinkingConfig: resumo não precisa de thinking
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const texto = result.response.text().trim()
    const tempoMs = Date.now() - inicio

    if (!texto || texto === 'ERRO_LINK_INACESSIVEL') {
      console.warn(`[SuperProva:investigarLink] ⚠️ Gemini retornou sem conteúdo relevante`)
      return null
    }

    console.log(`[SuperProva:investigarLink] ✅ KB gerada em ${tempoMs}ms | ${texto.length} chars`)
    return texto

  } catch (err) {
    console.error('[SuperProva:investigarLink] ❌ Falha no Gemini (fail-silently):', err)
    return null
  }
}
