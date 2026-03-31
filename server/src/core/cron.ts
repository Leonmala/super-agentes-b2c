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

  // c2. Processar turnos PROFESSOR_IA separadamente (memória longa da jornada IA)
  await processarProfessorIATurnos(alunoId, semanaRef, turnos as Turno[], usarQdrant)

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
// PROCESSAR TURNOS PROFESSOR_IA — MEMÓRIA LONGA
// ============================================================

/**
 * Processa turnos do PROFESSOR_IA separadamente para salvar no Qdrant
 * com namespace específico (professor_ia vs professor_ia_pai)
 */
export async function processarProfessorIATurnos(
  alunoId: string,
  semanaRef: string,
  turnos: Turno[],
  usarQdrant: boolean
): Promise<void> {
  // Filtrar apenas turnos do Professor Pense-AI
  const turnosProfessorIA = turnos.filter(t => t.agente === 'PROFESSOR_IA')

  if (turnosProfessorIA.length === 0) return

  // Buscar sessões para identificar tipo_usuario E responsavel_id (pai tem identidade própria)
  const sessaoIds = [...new Set(turnosProfessorIA.map(t => t.sessao_id))]
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id, tipo_usuario, responsavel_id')
    .in('id', sessaoIds)

  if (!sessoes || sessoes.length === 0) return

  type SessaoInfo = { tipo_usuario: 'filho' | 'pai'; responsavel_id: string | null }
  const sessaoMap = new Map<string, SessaoInfo>(
    sessoes.map(s => [s.id, {
      tipo_usuario: (s.tipo_usuario as 'filho' | 'pai') || 'filho',
      responsavel_id: s.responsavel_id || null
    }])
  )

  // Separar turnos por tipo_usuario
  const turnosFilho = turnosProfessorIA.filter(t => sessaoMap.get(t.sessao_id)?.tipo_usuario === 'filho')
  const turnosPai   = turnosProfessorIA.filter(t => sessaoMap.get(t.sessao_id)?.tipo_usuario === 'pai')

  // Processar grupo filho
  if (turnosFilho.length > 0) {
    await salvarGrupoProfessorIA(
      alunoId,
      null,           // filho: sem responsavel_id
      semanaRef,
      turnosFilho,
      'professor_ia',
      usarQdrant
    )
  }

  // Processar grupo pai — agrupar por responsavel_id (um pai pode ter múltiplos filhos)
  if (turnosPai.length > 0) {
    const responsavelIds = [...new Set(
      turnosPai.map(t => sessaoMap.get(t.sessao_id)?.responsavel_id).filter(Boolean)
    )] as string[]

    for (const responsavelId of responsavelIds) {
      const turnosDessePai = turnosPai.filter(
        t => sessaoMap.get(t.sessao_id)?.responsavel_id === responsavelId
      )
      await salvarGrupoProfessorIA(
        alunoId,
        responsavelId,  // pai: com responsavel_id (jornada pertence ao pai, não ao aluno)
        semanaRef,
        turnosDessePai,
        'professor_ia_pai',
        usarQdrant
      )
    }
  }
}

async function salvarGrupoProfessorIA(
  alunoId: string,
  responsavelId: string | null,
  semanaRef: string,
  turnos: Turno[],
  tipo: string,
  usarQdrant: boolean
): Promise<void> {
  // Gerar resumo focado em jornada de aprendizado de IA
  const resumo = await gerarResumoProfessorIA(turnos)

  let pontoId: string | null = null
  if (usarQdrant) {
    try {
      const embedding = await gerarEmbedding(resumo)
      pontoId = await salvarEmbeddingSemanal(alunoId, semanaRef, embedding, resumo, tipo)
    } catch (erro: any) {
      console.error(`[CRON] Erro Qdrant ${tipo} para ${alunoId}:`, erro.message)
    }
  }

  // Salvar referência em b2c_qdrant_refs
  const namespace = responsavelId
    ? `professor_ia_pai_${responsavelId}`
    : `professor_ia_${alunoId}`

  const { error: erroRef } = await supabase.from('b2c_qdrant_refs').insert({
    aluno_id: alunoId,
    responsavel_id: responsavelId,
    namespace,
    semana_ref: semanaRef,
    ponto_ids: pontoId ? [pontoId] : null,
    resumo_semantico: resumo
  })

  if (erroRef) {
    console.error(`[CRON] Erro ao salvar ref PROFESSOR_IA (${tipo}):`, erroRef.message)
  }

  console.log(`[CRON] PROFESSOR_IA (${tipo}): ${turnos.length} turnos → Qdrant para ${alunoId}`)
}

export async function gerarResumoProfessorIA(turnos: Turno[]): Promise<string> {
  const turnosTexto = turnos.map(t =>
    `Usuário: "${t.entrada}" → Professor Pense-AI: "${t.resposta.substring(0, 300)}..."`
  ).join('\n')

  const prompt = `Analise as interações desta semana com o Professor Pense-AI e gere um RESUMO DE JORNADA conciso (máximo 250 palavras).

O resumo deve capturar:
1. Nível atual na jornada de uso de IA (descreva o comportamento — ex: "pede respostas prontas sem contexto", "começa a elaborar intenção antes de pedir")
2. Prompts trabalhados e o que melhorou
3. Conceitos de IA que a pessoa aprendeu ou demonstrou curiosidade
4. Padrões de comportamento observados
5. Próxima oportunidade de aprendizado

INTERAÇÕES:
${turnosTexto}

RESUMO:`

  const systemPrompt = 'Você é um analista de aprendizado de IA. Gere resumos de jornada concisos, observacionais e práticos. Não use jargões pedagógicos pesados.'

  try {
    const resposta = await chamarLLM(systemPrompt, '', prompt, 'RESUMO_PROFESSOR_IA')
    return resposta.raw.trim()
  } catch (erro: any) {
    const temas = [...new Set(turnos.map(t => t.entrada.split(' ').slice(0, 5).join(' ')))].join(' | ')
    return `Semana com ${turnos.length} interações com Professor Pense-AI. Tópicos: ${temas}. Resumo automático indisponível.`
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
