import { supabase } from './supabase.js'
import type { UsoDiario } from './supabase.js'

const LIMITE_INTERACOES = 25
const LIMITE_TURNOS = 5

// ============================================================
// INCREMENTAR USO
// ============================================================

export async function incrementarUso(alunoId: string): Promise<UsoDiario> {
  // Obter data de hoje em formato YYYY-MM-DD
  const hoje = new Date().toISOString().split('T')[0]

  // Tentar buscar registro existente
  const { data: usuoExistente } = await supabase
    .from('b2c_uso_diario')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('data', hoje)
    .single()

  if (usuoExistente) {
    // Atualizar registro existente
    const novoUso = {
      ...usuoExistente,
      interacoes: (usuoExistente.interacoes || 0) + 1,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('b2c_uso_diario')
      .update({
        interacoes: novoUso.interacoes,
        updated_at: novoUso.updated_at
      })
      .eq('id', usuoExistente.id)

    if (error) {
      throw new Error(`Erro ao atualizar uso diário: ${error.message}`)
    }

    return novoUso as UsoDiario
  } else {
    // Criar novo registro
    const { data: novoUso, error } = await supabase
      .from('b2c_uso_diario')
      .insert({
        aluno_id: alunoId,
        data: hoje,
        interacoes: 1,
        turnos: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar uso diário: ${error.message}`)
    }

    return novoUso as UsoDiario
  }
}

// ============================================================
// BUSCAR USO DIÁRIO
// ============================================================

export async function buscarUsoDiario(alunoId: string): Promise<UsoDiario | null> {
  // Obter data de hoje em formato YYYY-MM-DD
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('b2c_uso_diario')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('data', hoje)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return null
    }
    throw new Error(`Erro ao buscar uso diário: ${error.message}`)
  }

  return data as UsoDiario
}

// ============================================================
// VERIFICAR LIMITE ATINGIDO
// ============================================================

export async function verificarLimiteAtingido(
  alunoId: string
): Promise<{
  atingido: boolean
  interacoes: number
  turnos: number
  mensagem?: string
}> {
  const uso = await buscarUsoDiario(alunoId)

  if (!uso) {
    return {
      atingido: false,
      interacoes: 0,
      turnos: 0
    }
  }

  const interacoes = uso.interacoes || 0
  const turnos = uso.turnos || 0

  const atingido = interacoes >= LIMITE_INTERACOES || turnos >= LIMITE_TURNOS

  const resultado = {
    atingido,
    interacoes,
    turnos
  } as {
    atingido: boolean
    interacoes: number
    turnos: number
    mensagem?: string
  }

  if (atingido) {
    if (interacoes >= LIMITE_INTERACOES && turnos >= LIMITE_TURNOS) {
      resultado.mensagem = `Você atingiu o limite diário de ${LIMITE_INTERACOES} interações e ${LIMITE_TURNOS} turnos. Volte amanhã para continuar aprendendo!`
    } else if (interacoes >= LIMITE_INTERACOES) {
      resultado.mensagem = `Você atingiu o limite diário de ${LIMITE_INTERACOES} interações. Volte amanhã para continuar aprendendo!`
    } else if (turnos >= LIMITE_TURNOS) {
      resultado.mensagem = `Você atingiu o limite diário de ${LIMITE_TURNOS} turnos. Volte amanhã para continuar aprendendo!`
    }
  }

  return resultado
}
