// server/src/super-prova/index.ts
// API pública do módulo Super Prova — fail-silently em todos os métodos
//
// FLUXO COMPLETO (para debug):
// [Hook 1] Agente pediu (PSICO detecta tema) → obterOuGerarAcervo → Gemini gera → salva cache
// [Hook 2] Agente pediu consulta (sinal CONSULTAR) → processarConsulta → Gemini busca → salva sessão
// [Hook 3] Aluno quer quiz (sinal QUIZ) → processarQuiz → Gemini gera → SSE event 'quiz'

import { supabase } from '../db/supabase.js'
import { gerarAcervo, AcervoGerado } from './gerar-acervo.js'
import { consultarKnowledgeBase, ResultadoConsulta } from './consultar.js'
import { gerarQuiz, QuizGerado } from './gerar-quiz.js'
import { investigarLink } from './investigar-link.js'

export { AcervoGerado, ResultadoConsulta, QuizGerado, investigarLink }

// Mapa de heroiId → materia (usado internamente)
const HEROI_MATERIA: Record<string, string> = {
  CALCULUS: 'matematica',
  VERBETTA: 'portugues',
  NEURON:   'ciencias_biologia',
  TEMPUS:   'historia',
  GAIA:     'geografia',
  VECTOR:   'fisica',
  ALKA:     'quimica',
  FLEX:     'idiomas',
}

function heroiIdParaMateria(heroiId: string): string {
  return HEROI_MATERIA[heroiId] ?? 'geral'
}

// Normaliza tema para chave de cache (lowercase, sem acentos, snake_case, max 80 chars)
export function normalizarTema(tema: string): string {
  return tema
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

// ─────────────────────────────────────────────────────────────────
// HOOK 1 — Verificar cache ou gerar acervo (chamado após PSICO detectar tema)
// Fire-and-forget — NUNCA bloqueia o stream SSE
// ─────────────────────────────────────────────────────────────────
export async function obterOuGerarAcervo(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string
): Promise<AcervoGerado | null> {
  const temaHash = normalizarTema(tema)
  console.log(`[SuperProva:index] ─── HOOK 1 iniciado ───`)
  console.log(`[SuperProva:index] 📥 Verificando cache | série: ${serie} | tema_hash: "${temaHash}" | herói: ${heroiId}`)

  try {
    // Verificar cache no Supabase
    const { data: cached, error: cacheErr } = await supabase
      .from('b2c_super_prova_acervo')
      .select('blocos, fontes, created_at')
      .eq('serie', serie)
      .eq('tema_hash', temaHash)
      .eq('materia', materia)
      .eq('heroi_id', heroiId)
      .single()

    if (cacheErr && cacheErr.code !== 'PGRST116') {
      // PGRST116 = not found (esperado), outros = erro real
      console.warn(`[SuperProva:index] ⚠️ Erro ao consultar cache: ${cacheErr.message}`)
    }

    if (cached) {
      console.log(`[SuperProva:index] ✅ Cache HIT — acervo existente, criado em: ${cached.created_at}`)
      return {
        blocos: cached.blocos as Record<string, string>,
        fontes: (cached.fontes as string[]) ?? [],
        geradoEm: cached.created_at as string,
      }
    }

    console.log(`[SuperProva:index] 🔄 Cache MISS — chamando Gemini para gerar acervo...`)
    const acervo = await gerarAcervo(tema, serie, materia, heroiId)

    // Salvar no cache (upsert por segurança)
    const { error: upsertErr } = await supabase.from('b2c_super_prova_acervo').upsert({
      serie,
      tema_hash: temaHash,
      tema_label: tema,
      materia,
      heroi_id: heroiId,
      blocos: acervo.blocos,
      fontes: acervo.fontes,
    })

    if (upsertErr) {
      console.warn(`[SuperProva:index] ⚠️ Erro ao salvar cache: ${upsertErr.message}`)
    } else {
      console.log(`[SuperProva:index] 💾 Acervo salvo no cache Supabase | blocos: ${Object.keys(acervo.blocos).length}`)
    }

    return acervo

  } catch (err) {
    console.error('[SuperProva:index] ❌ Hook 1 FALHOU (fail-silently):', err)
    return null   // fail-silently — não quebra o fluxo principal
  }
}

// ─────────────────────────────────────────────────────────────────
// Formatar acervo para injeção no contexto do herói
// ─────────────────────────────────────────────────────────────────
export function formatarKnowledgeBase(acervo: AcervoGerado): string {
  const linhas = Object.entries(acervo.blocos)
    .map(([id, conteudo]) => `[${id.toUpperCase()}]: ${conteudo}`)
    .join('\n')
  const kb = `KNOWLEDGE_BASE:\n${linhas}`
  console.log(`[SuperProva:index] 📤 KNOWLEDGE_BASE formatada | ${Object.keys(acervo.blocos).length} blocos | ${kb.length} chars`)
  return kb
}

// ─────────────────────────────────────────────────────────────────
// HOOK 2 — Processar sinal CONSULTAR
// Fire-and-forget — resultado salvo na sessão para o PRÓXIMO turno
// ─────────────────────────────────────────────────────────────────
export async function processarConsulta(
  query: string,
  tema: string,
  serie: string,
  heroiId: string
): Promise<ResultadoConsulta | null> {
  console.log(`[SuperProva:index] ─── HOOK 2 iniciado ───`)
  console.log(`[SuperProva:index] 🔎 Sinal CONSULTAR | herói: ${heroiId} | query: "${query}"`)

  try {
    const materia = heroiIdParaMateria(heroiId)
    const resultado = await consultarKnowledgeBase(query, tema, serie, heroiId)
    console.log(`[SuperProva:index] ✅ CONSULTA_RESULTADO pronto | ${resultado.resposta.length} chars | será injetado no próximo turno`)
    return resultado
  } catch (err) {
    console.error('[SuperProva:index] ❌ Hook 2 FALHOU (fail-silently):', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// HOOK 3 — Processar sinal QUIZ
// Aguarda resultado e gera SSE event 'quiz' — único hook que retorna para o stream
// ─────────────────────────────────────────────────────────────────
export async function processarQuiz(
  tema: string,
  serie: string,
  heroiId: string,
  resumoConversa: string
): Promise<QuizGerado | null> {
  console.log(`[SuperProva:index] ─── HOOK 3 iniciado ───`)
  console.log(`[SuperProva:index] 🎯 Sinal QUIZ | herói: ${heroiId} | tema: "${tema}" | série: ${serie}`)

  try {
    const materia = heroiIdParaMateria(heroiId)
    const quiz = await gerarQuiz(tema, serie, materia, resumoConversa)
    console.log(`[SuperProva:index] ✅ Quiz gerado | ${quiz.questoes.length} questões → enviando SSE event 'quiz'`)
    return quiz
  } catch (err) {
    console.error('[SuperProva:index] ❌ Hook 3 FALHOU (fail-silently):', err)
    return null
  }
}
