// CRON semanal — flush turnos → Qdrant → cleanup
// Roda domingo 23h (BRT) — requer TZ=America/Sao_Paulo no Railway
import cron from 'node-cron'
import { supabase } from '../db/supabase.js'
import type { Turno } from '../db/supabase.js'
import { chamarLLM } from './llm.js'
import {
  qdrantConfigurado,
  inicializarQdrant,
  gerarEmbedding,
  salvarEmbeddingSemanal
} from '../db/qdrant.js'

// ============================================================
// REGISTRAR CRON NO BOOT
// ============================================================

export function registrarCronSemanal(): void {
  // Domingo 23h (assume TZ=America/Sao_Paulo no env)
  // Se TZ não configurado, usar UTC: '0 2 * * 1' (segunda 02h UTC = domingo 23h BRT)
  const schedule = process.env.TZ === 'America/Sao_Paulo' ? '0 23 * * 0' : '0 2 * * 1'

  cron.schedule(schedule, async () => {
    console.log('[CRON] Iniciando flush semanal...')
    try {
      await executarFlushSemanal()
      console.log('[CRON] Flush semanal concluído com sucesso')
    } catch (erro: any) {
      console.error('[CRON] Erro no flush semanal:', erro.message)
    }
  })

  console.log(`[CRON] Flush semanal registrado (schedule: ${schedule}, TZ: ${process.env.TZ || 'UTC'})`)
}

// ============================================================
// FLUSH SEMANAL PRINCIPAL
// ============================================================

export async function executarFlushSemanal(): Promise<{
  alunosProcessados: number
  erros: string[]
}> {
  const erros: string[] = []
  let alunosProcessados = 0

  // Calcular início da semana (segunda anterior)
  const agora = new Date()
  const diaAtual = agora.getDay() // 0=domingo
  const diffSegunda = diaAtual === 0 ? 6 : diaAtual - 1
  const inicioSemana = new Date(agora)
  inicioSemana.setDate(agora.getDate() - diffSegunda)
  inicioSemana.setHours(0, 0, 0, 0)

  // Calcular semana ISO (YYYY-WNN)
  const semanaRef = calcularSemanaISO(agora)

  console.log(`[CRON] Semana: ${semanaRef}, Início: ${inicioSemana.toISOString()}`)

  // 1. Buscar alunos com turnos nesta semana
  const { data: alunosAtivos, error: erroBusca } = await supabase
    .from('b2c_turnos')
    .select('sessao_id')
    .gte('created_at', inicioSemana.toISOString())

  if (erroBusca || !alunosAtivos) {
    console.error('[CRON] Erro ao buscar turnos da semana:', erroBusca?.message)
    return { alunosProcessados: 0, erros: [erroBusca?.message || 'Sem dados'] }
  }

  // Obter aluno_ids únicos via sessões
  const sessaoIds = [...new Set(alunosAtivos.map(t => t.sessao_id))]

  if (sessaoIds.length === 0) {
    console.log('[CRON] Nenhum turno encontrado na semana. Nada a processar.')
    return { alunosProcessados: 0, erros: [] }
  }

  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id, aluno_id')
    .in('id', sessaoIds)

  if (!sessoes) {
    return { alunosProcessados: 0, erros: ['Sem sessões encontradas'] }
  }

  const alunoIds = [...new Set(sessoes.map(s => s.aluno_id))]

  // Inicializar Qdrant se configurado
  const usarQdrant = qdrantConfigurado()
  if (usarQdrant) {
    try {
      await inicializarQdrant()
    } catch (erro: any) {
      console.error('[CRON] Qdrant não disponível, continuando sem embeddings:', erro.message)
    }
  } else {
    console.log('[CRON] Qdrant não configurado — skip embeddings')
  }

  // 2. Processar cada aluno
  for (const alunoId of alunoIds) {
    try {
      await processarAlunoSemanal(alunoId, semanaRef, inicioSemana, usarQdrant)
      alunosProcessados++
      console.log(`[CRON] Aluno ${alunoId} processado (${alunosProcessados}/${alunoIds.length})`)
    } catch (erro: any) {
      const msg = `Aluno ${alunoId}: ${erro.message}`
      erros.push(msg)
      console.error(`[CRON] Erro: ${msg}`)
      // Continuar com próximo aluno
    }
  }

  console.log(`[CRON] Resultado: ${alunosProcessados} processados, ${erros.length} erros`)
  return { alunosProcessados, erros }
}

// ============================================================
// PROCESSAR ALUNO INDIVIDUAL
// ============================================================

async function processarAlunoSemanal(
  alunoId: string,
  semanaRef: string,
  inicioSemana: Date,
  usarQdrant: boolean
): Promise<void> {
  // a. Buscar sessões do aluno
  const { data: sessoesAluno } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (!sessoesAluno || sessoesAluno.length === 0) return

  const sessaoIds = sessoesAluno.map(s => s.id)

  // b. Buscar turnos da semana
  const { data: turnos, error: erroTurnos } = await supabase
    .from('b2c_turnos')
    .select('*')
    .in('sessao_id', sessaoIds)
    .gte('created_at', inicioSemana.toISOString())
    .order('created_at', { ascending: true })

  if (erroTurnos || !turnos || turnos.length === 0) return

  // c. Gerar resumo semântico via LLM
  const resumo = await gerarResumoSemantico(turnos as Turno[])

  // d. Gerar embedding e salvar no Qdrant (se configurado)
  let pontoId: string | null = null
  if (usarQdrant) {
    try {
      const embedding = await gerarEmbedding(resumo)
      pontoId = await salvarEmbeddingSemanal(alunoId, semanaRef, embedding, resumo)
    } catch (erro: any) {
      console.error(`[CRON] Erro Qdrant para ${alunoId}:`, erro.message)
      // Continuar sem Qdrant — backup ainda acontece
    }
  }

  // e. Backup dos turnos
  const turnosBackup = turnos.map(t => ({
    sessao_id: t.sessao_id,
    aluno_id: alunoId,
    numero: t.numero,
    agente: t.agente,
    entrada: t.entrada,
    resposta: t.resposta,
    status: t.status,
    plano: t.plano,
    semana_ref: semanaRef,
    original_created_at: t.created_at
  }))

  const { error: erroBackup } = await supabase
    .from('b2c_turnos_backup')
    .insert(turnosBackup)

  if (erroBackup) {
    throw new Error(`Falha no backup: ${erroBackup.message}`)
  }

  // f. Salvar referência Qdrant
  const { error: erroRef } = await supabase
    .from('b2c_qdrant_refs')
    .insert({
      aluno_id: alunoId,
      namespace: `aluno_${alunoId}`,
      semana_ref: semanaRef,
      ponto_ids: pontoId ? [pontoId] : null,
      resumo_semantico: resumo
    })

  if (erroRef) {
    console.error(`[CRON] Erro ao salvar ref Qdrant:`, erroRef.message)
    // Não-fatal — continuar
  }

  // g. Deletar turnos originais
  const turnoIds = turnos.map(t => t.id)
  const { error: erroDelete } = await supabase
    .from('b2c_turnos')
    .delete()
    .in('id', turnoIds)

  if (erroDelete) {
    throw new Error(`Falha ao deletar turnos: ${erroDelete.message}`)
  }

  // h. Encerrar sessões ativas do aluno
  await supabase
    .from('b2c_sessoes')
    .update({ status: 'encerrada', updated_at: new Date().toISOString() })
    .eq('aluno_id', alunoId)
    .eq('status', 'ativa')

  console.log(`[CRON] Aluno ${alunoId}: ${turnos.length} turnos backed up, sessões encerradas`)
}

// ============================================================
// GERAR RESUMO SEMÂNTICO VIA LLM
// ============================================================

export async function gerarResumoSemantico(turnos: Turno[]): Promise<string> {
  // Montar texto dos turnos para o LLM
  const turnosTexto = turnos.map(t =>
    `[${t.agente}] Aluno: "${t.entrada}" → Resposta: "${t.resposta.substring(0, 200)}..."`
  ).join('\n')

  const prompt = `Analise as interações educacionais desta semana e gere um RESUMO SEMÂNTICO conciso (máximo 300 palavras).

O resumo deve incluir:
1. Matérias trabalhadas e temas específicos
2. Nível de compreensão demonstrado pelo aluno
3. Dificuldades identificadas
4. Progresso observado
5. Recomendações para a próxima semana

INTERAÇÕES DA SEMANA:
${turnosTexto}

RESUMO SEMÂNTICO:`

  // Usar PSICO model para resumo (mais inteligente)
  const systemPrompt = 'Você é um analista pedagógico. Gere resumos educacionais concisos e úteis.'

  try {
    const resposta = await chamarLLM(systemPrompt, '', prompt, 'RESUMO_SEMANAL')
    return resposta.raw.trim()
  } catch (erro: any) {
    // Fallback: resumo básico sem LLM
    const materias = [...new Set(turnos.map(t => t.agente))].join(', ')
    return `Semana com ${turnos.length} interações. Matérias: ${materias}. Resumo automático não disponível.`
  }
}

// ============================================================
// HELPERS
// ============================================================

export function calcularSemanaISO(data: Date): string {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
