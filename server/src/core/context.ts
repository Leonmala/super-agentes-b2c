// Montagem de contexto para o LLM
// Suporta MODO FILHO e MODO PAI

import type { Aluno, Sessao, Turno } from '../db/supabase.js'

export function montarContexto(
  sessao: Sessao,
  aluno: Aluno,
  ultimosTurnos: Turno[],
  tipoUsuario?: 'filho' | 'pai'
): string {
  const partes: string[] = []

  // Modo de operação
  const modo = tipoUsuario === 'pai' ? 'PAI' : 'FILHO'
  partes.push(`MODO: ${modo}`)

  // Dados do aluno
  partes.push(`ALUNO: ${aluno.nome}, ${aluno.idade || '?'} anos, ${aluno.serie}`)

  if (aluno.perfil) {
    partes.push(`PERFIL: ${aluno.perfil}`)
  }

  if (aluno.dificuldades) {
    partes.push(`DIFICULDADES CONHECIDAS: ${aluno.dificuldades}`)
  }

  if (aluno.interesses) {
    partes.push(`INTERESSES: ${aluno.interesses}`)
  }

  // Estado atual
  partes.push(`TURNO ATUAL: ${sessao.turno_atual + 1}`)
  partes.push(`AGENTE ANTERIOR: ${sessao.agente_atual}`)
  if (sessao.tema_atual) {
    partes.push(`TEMA ATUAL: ${sessao.tema_atual}`)
  }

  // Plano ativo (se existir)
  if (sessao.plano_ativo) {
    partes.push(`PLANO ATIVO: ${sessao.plano_ativo}`)
    partes.push(`INSTRUÇÃO: Siga o plano acima fielmente.`)
  } else {
    partes.push(`PLANO ATIVO: Nenhum — qualificar primeiro`)
  }

  // Histórico resumido (se existir)
  if (sessao.historico_resumido) {
    partes.push(`RESUMO DA SESSÃO: ${sessao.historico_resumido}`)
  }

  // Últimos turnos
  if (ultimosTurnos.length > 0) {
    partes.push('')
    partes.push('HISTÓRICO RECENTE:')

    const ordenados = [...ultimosTurnos].sort((a, b) => a.numero - b.numero)

    for (const turno of ordenados) {
      const resumoResposta = turno.resposta.length > 250
        ? turno.resposta.substring(0, 250) + '...'
        : turno.resposta
      partes.push(`[${turno.numero}] ${turno.agente}: "${resumoResposta}"`)
    }
  }

  // Instruções de MODO PAI (se aplicável)
  if (tipoUsuario === 'pai') {
    partes.push('')
    partes.push('═══════════════════════════════════════════')
    partes.push('INSTRUÇÕES DE MODO PAI')
    partes.push('═══════════════════════════════════════════')
    partes.push('Você está atendendo o RESPONSÁVEL do aluno.')
    partes.push('Adapte a linguagem para um adulto.')
    partes.push('Oriente o pai/mãe sobre como pode ensinar ao filho o que ele pedir.')
    partes.push('Foque em estratégias práticas e exemplos que o responsável pode usar.')
    partes.push('Seja apoiador e pedagógico, não passe por cima do responsável.')
    if (ultimosTurnos.length === 0) {
      partes.push('PRIMEIRA_INTERACAO_PAI: SIM — o pai ainda não especificou o que precisa. Apresente-se e pergunte antes de ensinar qualquer coisa.')
    }
  }

  return partes.join('\n')
}
