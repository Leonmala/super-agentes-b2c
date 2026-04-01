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
  // Buscar sessão ativa existente
  const { data: sessoes, error: erroBusca } = await supabase
    .from('b2c_sessoes')
    .select('*')
    .eq('aluno_id', alunoId)
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
 * Usado pelo SUPERVISOR para ver o que a filha estudou — NÃO os turnos do pai
 */
export async function buscarTurnosDaFilha(
  alunoId: string,
  limite: number = 10
): Promise<Turno[]> {
  // Sessões onde a filha usou o sistema como aluna
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('tipo_usuario', 'filho')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!sessoes || sessoes.length === 0) return []

  const sessaoIds = sessoes.map((s: { id: string }) => s.id)

  const { data, error } = await supabase
    .from('b2c_turnos')
    .select('*')
    .in('sessao_id', sessaoIds)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Erro ao buscar turnos da filha:', error)
    return []
  }

  return (data || []) as Turno[]
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
