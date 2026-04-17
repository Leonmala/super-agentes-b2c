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

  // Plano ativo (se existir) — injeta de forma estruturada para o herói
  if (sessao.plano_ativo) {
    try {
      const planoObj = JSON.parse(sessao.plano_ativo) as Record<string, unknown>
      // Detectar se é um plano_universal (Método Universal)
      if (
        planoObj.ativo === true &&
        Array.isArray(planoObj.topicos) &&
        typeof planoObj.topico_atual_id === 'number'
      ) {
        const topicos = planoObj.topicos as Array<{ id: number; nome: string; status: string }>
        const topicoAtual = topicos.find(t => t.id === planoObj.topico_atual_id)
        const pendentes = topicos.filter(t => t.status !== 'concluido')
        const concluidos = topicos.filter(t => t.status === 'concluido')
        const ehUltimo = pendentes.length === 1 && topicoAtual && topicoAtual.status !== 'concluido'

        partes.push('')
        partes.push('═══════════════════════════════════════════')
        partes.push('PLANO UNIVERSAL ATIVO — MÉTODO UNIVERSAL')
        partes.push('═══════════════════════════════════════════')
        partes.push(`TÓPICO ATUAL: ${topicoAtual ? topicoAtual.nome : 'Desconhecido'}`)
        partes.push(`PROGRESSO: ${concluidos.length}/${topicos.length} tópicos concluídos`)
        if (pendentes.length > 1) {
          const proximosNomes = pendentes.slice(1).map(t => t.nome).join(' → ')
          partes.push(`PRÓXIMOS TÓPICOS: ${proximosNomes}`)
        }
        if (ehUltimo) {
          partes.push(`⚡ ESTE É O ÚLTIMO TÓPICO. Ao concluir, o sistema emitirá o QUIZ automaticamente.`)
        }
        partes.push('')
        partes.push('INSTRUÇÃO OBRIGATÓRIA — MÉTODO UNIVERSAL:')
        partes.push(`1. Ensine APENAS o tópico atual: "${topicoAtual ? topicoAtual.nome : ''}"`)
        partes.push('2. Monitore o domínio: 2 respostas corretas consecutivas OU "já entendi tudo" → emita avançar_topico: true')
        partes.push('3. NÃO emita avançar_topico: true se o aluno ainda tem dúvidas')
        partes.push('4. QUIZ só é disparado pelo sistema ao final de TODOS os tópicos — não peça quiz você mesmo')
        partes.push('═══════════════════════════════════════════')
      } else {
        // plano_atendimento convencional (PSICO sem método universal)
        partes.push(`PLANO ATIVO: ${sessao.plano_ativo}`)
        partes.push(`INSTRUÇÃO: Siga o plano acima fielmente.`)
      }
    } catch {
      // JSON inválido — exibir cru
      partes.push(`PLANO ATIVO: ${sessao.plano_ativo}`)
      partes.push(`INSTRUÇÃO: Siga o plano acima fielmente.`)
    }
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
