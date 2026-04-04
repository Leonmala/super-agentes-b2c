// Persistência no Supabase — pós-resposta
// Todas as tabelas usam prefixo b2c_ para isolamento no Supabase

import { supabase } from './supabase.js'
import type { Aluno, Sessao, Turno } from './supabase.js'
import type { SinaisPedagogicos } from '../core/response-processor.js'

export async function persistirTurno(
  sessaoId: string,
  numero: number,
  agente: string,
  entrada: string,
  resposta: string,
  status: Turno['status'],
  plano: string | null,
  sinais?: SinaisPedagogicos | null
): Promise<void> {
  const { error } = await supabase.from('b2c_turnos').insert({
    sessao_id: sessaoId,
    numero,
    agente,
    entrada,
    resposta,
    status,
    plano,
    sinal_psicopedagogico: sinais?.sinal_psicopedagogico ?? false,
    motivo_sinal: sinais?.motivo_sinal ?? null,
    observacoes_internas: sinais?.observacoes_internas ?? null
  })

  if (error) {
    console.error('Erro ao persistir turno:', error)
    throw new Error(`Falha ao persistir turno: ${error.message}`)
  }
}

export async function atualizarSessao(
  sessaoId: string,
  updates: {
    turno_atual?: number
    agente_atual?: string
    tema_atual?: string | null
    plano_ativo?: string | null
    status?: Sessao['status']
    instrucoes_pendentes?: string | null
    agente_destino?: string | null
    transicao_pendente?: boolean
  }
): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('Erro ao atualizar sessão:', error)
    throw new Error(`Falha ao atualizar sessão: ${error.message}`)
  }
}

export async function atualizarUltimoTurno(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({ ultimo_turno_at: new Date().toISOString() })
    .eq('id', sessaoId)

  if (error) {
    console.error('❌ Erro ao atualizar ultimo_turno_at:', error)
  }
}

export async function resetarSessaoAgente(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      agente_atual: 'PSICOPEDAGOGICO',
      tema_atual: null,
      ultimo_turno_at: new Date().toISOString(),
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('❌ Erro ao resetar sessão agente:', error)
  }
}

export async function buscarOuCriarSessao(
  alunoId: string,
  tipoUsuario: 'filho' | 'pai' = 'filho'
): Promise<Sessao> {
  // Buscar sessão ativa existente — FILTRO POR tipo_usuario obrigatório
  // Sem esse filtro, sessões 'pai' e 'filho' se misturam no mesmo aluno_id,
  // contaminando os dados do aluno com conversas do responsável.
  const { data: sessoes, error: erroBusca } = await supabase
    .from('b2c_sessoes')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('tipo_usuario', tipoUsuario)
    .eq('status', 'ativa')
    .order('created_at', { ascending: false })
    .limit(1)

  if (erroBusca) {
    throw new Error(`Erro ao buscar sessão: ${erroBusca.message}`)
  }

  if (sessoes && sessoes.length > 0) {
    return sessoes[0] as Sessao
  }

  // Criar nova sessão
  const { data: novaSessao, error: erroCriacao } = await supabase
    .from('b2c_sessoes')
    .insert({
      aluno_id: alunoId,
      tipo_usuario: tipoUsuario,
      turno_atual: 0,
      agente_atual: 'PSICOPEDAGOGICO',
      status: 'ativa',
      transicao_pendente: false
    })
    .select()
    .single()

  if (erroCriacao || !novaSessao) {
    throw new Error(`Erro ao criar sessão: ${erroCriacao?.message || 'unknown'}`)
  }

  return novaSessao as Sessao
}

export async function buscarAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('b2c_alunos')
    .select('*')
    .eq('id', alunoId)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar aluno: ${error.message}`)
  }

  return data
}

export async function buscarUltimosTurnos(sessaoId: string, limite: number = 3): Promise<Turno[]> {
  const { data, error } = await supabase
    .from('b2c_turnos')
    .select('*')
    .eq('sessao_id', sessaoId)
    .order('numero', { ascending: false })
    .limit(limite)

  if (error) {
    throw new Error(`Erro ao buscar turnos: ${error.message}`)
  }

  return (data || []) as Turno[]
}

// ============================================================
// FUNÇÕES DE TRANSIÇÃO DE PERSONAS
// ============================================================

/**
 * Salva instruções do PSICOPEDAGOGICO para o próximo herói
 * Usado quando PSICO decide ENCAMINHAR_PARA_HEROI
 */
export async function salvarTransicaoPendente(
  sessaoId: string,
  agenteDestino: string,
  instrucoes: string,
  plano?: string
): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      agente_destino: agenteDestino,
      instrucoes_pendentes: instrucoes,
      transicao_pendente: true,
      plano_ativo: plano || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('Erro ao salvar transição:', error)
    throw new Error(`Falha ao salvar transição: ${error.message}`)
  }

  console.log(`[Transição] Salva: ${agenteDestino} aguardando ativação`)
}

/**
 * Limpa dados de transição após o herói responder
 */
export async function limparTransicaoPendente(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      agente_destino: null,
      instrucoes_pendentes: null,
      transicao_pendente: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('Erro ao limpar transição:', error)
    throw new Error(`Falha ao limpar transição: ${error.message}`)
  }
}

/**
 * Verifica se há uma transição pendente e retorna o herói escolhido
 */
export function verificarTransicaoPendente(sessao: Sessao): {
  temTransicao: boolean
  agenteDestino: string | null
  instrucoes: string | null
} {
  if (sessao.transicao_pendente && sessao.agente_destino) {
    return {
      temTransicao: true,
      agenteDestino: sessao.agente_destino,
      instrucoes: sessao.instrucoes_pendentes
    }
  }

  return {
    temTransicao: false,
    agenteDestino: null,
    instrucoes: null
  }
}

/**
 * Busca turnos com sinais pedagógicos do aluno (para SUPERVISOR)
 * Retorna turnos onde sinal_psicopedagogico = true
 */
export async function buscarSinaisAluno(
  alunoId: string,
  limite: number = 20
): Promise<Turno[]> {
  // Buscar sessões do aluno
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (!sessoes || sessoes.length === 0) return []

  const sessaoIds = sessoes.map(s => s.id)

  const { data, error } = await supabase
    .from('b2c_turnos')
    .select('*')
    .eq('sinal_psicopedagogico', true)
    .in('sessao_id', sessaoIds)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Erro ao buscar sinais do aluno:', error)
    return []
  }

  return (data || []) as Turno[]
}

/**
 * Busca os turnos REAIS da filha como aluna (sessões tipo_usuario='filho')
 * Limitado aos últimos 14 dias para evitar resíduo de sessões de teste.
 * Usado pelo SUPERVISOR — NÃO retorna turnos do pai.
 */
export async function buscarTurnosDaFilha(
  alunoId: string,
  limite: number = 10,
  diasAtras: number = 14
): Promise<Turno[]> {
  const dataCorte = new Date()
  dataCorte.setDate(dataCorte.getDate() - diasAtras)

  // Sessões da filha como aluna nos últimos N dias
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('tipo_usuario', 'filho')
    .gte('updated_at', dataCorte.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (!sessoes || sessoes.length === 0) return []

  const sessaoIds = sessoes.map((s: { id: string }) => s.id)

  const { data, error } = await supabase
    .from('b2c_turnos')
    .select('*')
    .in('sessao_id', sessaoIds)
    .gte('created_at', dataCorte.toISOString())
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Erro ao buscar turnos da filha:', error)
    return []
  }

  return (data || []) as Turno[]
}

// ============================================================
// SUPERVISOR EDUCACIONAL — SESSÃO E MEMÓRIA POR CONVERSA
// ============================================================

export interface HistoricoSupervisorItem {
  role: 'pai' | 'supervisor'
  conteudo: string
  ts: string
}

/**
 * Cria ou recupera a sessão Supervisor da família.
 * Sessão é POR FAMÍLIA (não por filha) — o pai pode alternar entre filhas
 * sem reiniciar a sessão. Flush apenas quando o pai sai do agente (nova_sessao=true).
 */
export async function buscarOuCriarSessaoSupervisor(
  familiaId: string,
  novaSessao: boolean
): Promise<{ id: string; historico: HistoricoSupervisorItem[]; ultima_interacao_pai: string | null }> {
  if (novaSessao) {
    // UPSERT: garante que existe e limpa o histórico (flush ao entrar no agente)
    const { data, error } = await supabase
      .from('b2c_supervisor_sessoes')
      .upsert(
        {
          familia_id: familiaId,
          historico: [],
          updated_at: new Date().toISOString()
        },
        { onConflict: 'familia_id', ignoreDuplicates: false }
      )
      .select('id, historico, ultima_interacao_pai')
      .single()

    if (error || !data) {
      console.error('[Supervisor] Erro ao criar sessão:', error?.message)
      return { id: '', historico: [], ultima_interacao_pai: null }
    }
    return {
      id: data.id as string,
      historico: [],
      ultima_interacao_pai: (data.ultima_interacao_pai as string) || null
    }
  }

  // SELECT existente
  const { data } = await supabase
    .from('b2c_supervisor_sessoes')
    .select('id, historico, ultima_interacao_pai')
    .eq('familia_id', familiaId)
    .single()

  if (!data) {
    // Primeira vez — criar sessão
    return buscarOuCriarSessaoSupervisor(familiaId, true)
  }

  return {
    id: data.id as string,
    historico: (data.historico as HistoricoSupervisorItem[]) || [],
    ultima_interacao_pai: (data.ultima_interacao_pai as string) || null
  }
}

/**
 * Busca o nome do primeiro responsável da família.
 * Usado pelo SUPERVISOR para saudação personalizada ("Oi Leon, tudo bem?").
 */
export async function buscarNomeResponsavel(familiaId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('b2c_responsaveis')
    .select('nome')
    .eq('familia_id', familiaId)
    .limit(1)
    .single()

  if (error || !data) return null
  // Retorna apenas o primeiro nome
  const nome = data.nome as string
  return nome ? nome.split(' ')[0] : null
}

/**
 * Salva o par pergunta/resposta no histórico da sessão Supervisor.
 * Mantém no máximo 20 pares (40 itens) para não inflar o contexto.
 */
export async function salvarTurnoSupervisor(
  familiaId: string,
  entradaPai: string,
  respostaSupervisor: string
): Promise<void> {
  const agora = new Date().toISOString()

  const novosItens: HistoricoSupervisorItem[] = [
    { role: 'pai', conteudo: entradaPai, ts: agora },
    { role: 'supervisor', conteudo: respostaSupervisor, ts: agora }
  ]

  // Buscar histórico atual
  const { data } = await supabase
    .from('b2c_supervisor_sessoes')
    .select('historico')
    .eq('familia_id', familiaId)
    .single()

  const historicoAtual: HistoricoSupervisorItem[] = (data?.historico as HistoricoSupervisorItem[]) || []
  const historicoAtualizado = [...historicoAtual, ...novosItens].slice(-40) // máx 20 pares

  await supabase
    .from('b2c_supervisor_sessoes')
    .update({
      historico: historicoAtualizado,
      ultima_interacao_pai: agora,
      updated_at: agora
    })
    .eq('familia_id', familiaId)
}

/**
 * Retorna a data do turno mais recente da filha como aluna.
 * Usa b2c_turnos.created_at — turno só existe quando a aluna enviou mensagem.
 * NÃO usa b2c_sessoes.updated_at (pode ser atualizado por operações do sistema).
 */
export async function buscarUltimaInteracaoFilha(alunoId: string): Promise<string | null> {
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('tipo_usuario', 'filho')

  if (!sessoes || sessoes.length === 0) return null

  const sessaoIds = sessoes.map((s: { id: string }) => s.id)

  const { data } = await supabase
    .from('b2c_turnos')
    .select('created_at')
    .in('sessao_id', sessaoIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (data?.created_at as string) || null
}

/**
 * Retorna todos os alunos de uma família — usado pelo SUPERVISOR para listar filhos
 */
export async function buscarFilhosDaFamilia(familiaId: string): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from('b2c_alunos')
    .select('*')
    .eq('familia_id', familiaId)
    .order('nome', { ascending: true })

  if (error) throw new Error(`Erro ao buscar filhos: ${error.message}`)
  return (data || []) as Aluno[]
}

/**
 * Busca histórico completo do aluno (todas as sessões)
 * Usado para verificar se já foi atendido por uma persona específica
 */
export async function verificarHistoricoAluno(
  alunoId: string,
  agente: string
): Promise<boolean> {
  // Busca por sessões do aluno para filtrar apenas seus turnos
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (!sessoes || sessoes.length === 0) return false

  const sessaoIds = sessoes.map(s => s.id)

  const { data, error } = await supabase
    .from('b2c_turnos')
    .select('id')
    .eq('agente', agente)
    .in('sessao_id', sessaoIds)
    .limit(1)

  if (error) {
    console.error('Erro ao verificar histórico:', error)
    return false
  }

  return (data?.length ?? 0) > 0
}

// ============================================================
// FUNÇÕES SUPER PROVA — knowledge base e consulta na sessão
// ============================================================

/**
 * Persiste a KNOWLEDGE_BASE gerada pelo Super Prova na sessão atual.
 * Chamada pelo Hook 1 (fire-and-forget) após acervo gerado/obtido do cache.
 */
export async function persistirKnowledgeBase(sessaoId: string, kb: string): Promise<void> {
  console.log(`[SuperProva:persistence] 💾 Salvando KNOWLEDGE_BASE na sessão ${sessaoId} | ${kb.length} chars`)
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({ super_prova_kb: kb })
    .eq('id', sessaoId)

  if (error) {
    console.error(`[SuperProva:persistence] ❌ Erro ao salvar KB: ${error.message}`)
  } else {
    console.log(`[SuperProva:persistence] ✅ KNOWLEDGE_BASE salva — disponível no próximo turno`)
  }
}

/**
 * Busca a KNOWLEDGE_BASE da sessão para injetar no contexto do herói.
 */
export async function buscarKnowledgeBase(sessaoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('b2c_sessoes')
    .select('super_prova_kb')
    .eq('id', sessaoId)
    .single()

  if (error || !data) return null
  const kb = data.super_prova_kb as string | null
  if (kb) {
    console.log(`[SuperProva:persistence] 📖 KNOWLEDGE_BASE encontrada (${kb.length} chars) — injetando no contexto`)
  }
  return kb ?? null
}

/**
 * Persiste o resultado de uma consulta CONSULTAR na sessão (one-shot).
 * Chamada pelo Hook 2 (fire-and-forget) após consulta respondida.
 */
export async function persistirConsultaResultado(sessaoId: string, resultado: string): Promise<void> {
  console.log(`[SuperProva:persistence] 💾 Salvando CONSULTA_RESULTADO na sessão ${sessaoId} | ${resultado.length} chars`)
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({ super_prova_consulta_resultado: resultado })
    .eq('id', sessaoId)

  if (error) {
    console.error(`[SuperProva:persistence] ❌ Erro ao salvar consulta: ${error.message}`)
  } else {
    console.log(`[SuperProva:persistence] ✅ CONSULTA_RESULTADO salvo — disponível no próximo turno`)
  }
}

/**
 * Busca o resultado de consulta da sessão para injetar no contexto.
 */
export async function buscarConsultaResultado(sessaoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('b2c_sessoes')
    .select('super_prova_consulta_resultado')
    .eq('id', sessaoId)
    .single()

  if (error || !data) return null
  const resultado = data.super_prova_consulta_resultado as string | null
  if (resultado) {
    console.log(`[SuperProva:persistence] 📨 CONSULTA_RESULTADO encontrado (${resultado.length} chars) — injetando no contexto`)
  }
  return resultado ?? null
}

/**
 * Limpa o resultado de consulta após uso (one-shot — não deve ser reaproveitado).
 */
export async function limparConsultaResultado(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({ super_prova_consulta_resultado: null })
    .eq('id', sessaoId)

  if (error) {
    console.error(`[SuperProva:persistence] ❌ Erro ao limpar consulta: ${error.message}`)
  } else {
    console.log(`[SuperProva:persistence] 🧹 CONSULTA_RESULTADO limpo (one-shot consumido)`)
  }
}
