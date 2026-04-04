// server/src/super-prova/gerar-acervo.ts
// Chama Gemini com Google Search Grounding e retorna blocos estruturados nos formatos do herói

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getFontesParaMateria } from './fontes-por-materia.js'
import { getHeroBlocks, HeroBlockDefinition } from './hero-blocks-config.js'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')

export interface AcervoGerado {
  blocos: Record<string, string>   // blockId → conteúdo estruturado
  fontes: string[]
  geradoEm: string
}

function montarPromptSintese(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string,
  blocos: HeroBlockDefinition[],
  fontesTexto: string
): string {
  const blocosDescricao = blocos
    .map(b => `- **${b.nome}** (id: ${b.id}): ${b.descricao}. Exemplo: "${b.exemplo}"`)
    .join('\n')

  return `Você é um assistente pedagógico especializado em educação básica brasileira (BNCC).

Crie uma base de conhecimento sobre "${tema}" para alunos do ${serie}, estruturada para o professor ${heroiId}.

## Fontes pedagógicas de referência
${fontesTexto || 'Use o Google Search para buscar conteúdo confiável.'}

## Blocos didáticos do professor ${heroiId}

${blocosDescricao}

## Sua tarefa

Retorne um JSON com exatamente este formato:
{
  "blocos": {
    "id_do_bloco": "conteúdo rico e específico sobre ${tema} neste formato didático",
    ... (um campo para cada bloco listado acima)
  },
  "fontes": ["url1", "url2", ...]
}

Regras:
- Cada bloco deve ter conteúdo ESPECÍFICO sobre "${tema}", não genérico
- Use linguagem adequada ao ${serie} (aluno brasileiro)
- Alinhamento com BNCC quando relevante
- Inclua fatos concretos, exemplos didáticos práticos
- Para blocos de visual/diagrama, use ASCII simples
- Máximo 300 caracteres por bloco (será expandido pelo professor)
- Retorne SOMENTE o JSON, sem markdown ao redor`
}

function descricaoFontes(materia: string): string {
  const fontes = getFontesParaMateria(materia)
  if (fontes.length === 0) return ''
  const nomes = fontes.map(f => `${f.nome} (${f.url})`).join(', ')
  return `Priorize conteúdo das seguintes fontes pedagógicas quando disponível via busca: ${nomes}`
}

export async function gerarAcervo(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string
): Promise<AcervoGerado> {
  const blocos = getHeroBlocks(heroiId)
  const fontesTexto = descricaoFontes(materia)
  const prompt = montarPromptSintese(tema, serie, materia, heroiId, blocos, fontesTexto)

  console.log(`[SuperProva:gerar-acervo] 🔄 Gerando acervo | herói: ${heroiId} | tema: "${tema}" | série: ${serie} | matéria: ${materia}`)
  console.log(`[SuperProva:gerar-acervo] 📚 Blocos configurados: ${blocos.map(b => b.id).join(', ')}`)

  const inicioChamada = Date.now()

  // Gemini com Google Search Grounding (mesmo padrão do PROFESSOR_IA)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // @ts-ignore — googleSearch suportado em @google/generative-ai ≥0.21 mas ausente nos tipos antigos
    tools: [{ googleSearch: {} }],
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const tempoMs = Date.now() - inicioChamada

  console.log(`[SuperProva:gerar-acervo] ✅ Gemini respondeu em ${tempoMs}ms | chars: ${text.length}`)

  // Log grounding metadata
  try {
    const grounding = (result.response as any).candidates?.[0]?.groundingMetadata
    if (grounding?.webSearchQueries?.length) {
      console.log(`[SuperProva:gerar-acervo] 🔍 Buscas realizadas: ${grounding.webSearchQueries.join(', ')}`)
    }
  } catch {
    // fail-silently — metadados de grounding são opcionais
  }

  // Extrair JSON da resposta
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`[SuperProva:gerar-acervo] ❌ Gemini não retornou JSON válido. Raw: ${text.slice(0, 200)}`)
    throw new Error(`[SuperProva] JSON inválido para tema: ${tema}`)
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    blocos: Record<string, string>
    fontes: string[]
  }

  const blocosRetornados = Object.keys(parsed.blocos ?? {})
  console.log(`[SuperProva:gerar-acervo] 📦 Blocos retornados: ${blocosRetornados.join(', ')}`)

  return {
    blocos: parsed.blocos ?? {},
    fontes: parsed.fontes ?? [],
    geradoEm: new Date().toISOString(),
  }
}
