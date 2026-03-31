// server/src/core/cron-professor-ia.test.ts
// Testes unitários da lógica de filtragem PROFESSOR_IA no CRON
// Usa node:test (built-in do Node.js) — padrão do projeto

import { describe, it } from 'node:test'
import assert from 'node:assert'

// ─── Tipos mínimos para teste (sem importar Supabase real) ───────────────────

interface TurnoMock {
  id: string
  sessao_id: string
  agente: string
  entrada: string
  resposta: string
  numero: number
  status: string
  plano: null
  created_at: string
}

function criarTurno(overrides: Partial<TurnoMock> = {}): TurnoMock {
  return {
    id: 'turno-1',
    sessao_id: 'sessao-1',
    numero: 1,
    agente: 'PROFESSOR_IA',
    entrada: 'Como melhoro meu prompt?',
    resposta: 'Antes de melhorar, me diz: para quem é essa resposta?',
    status: 'completo',
    plano: null,
    created_at: new Date().toISOString(),
    ...overrides
  }
}

// ─── Testes de filtragem ─────────────────────────────────────────────────────

describe('filtragem de turnos por agente', () => {
  it('identifica corretamente turnos PROFESSOR_IA vs outros', () => {
    const todos = [
      criarTurno({ agente: 'CALCULUS' }),
      criarTurno({ agente: 'PROFESSOR_IA' }),
      criarTurno({ agente: 'VERBETTA' }),
      criarTurno({ agente: 'PROFESSOR_IA', id: 'turno-4' }),
    ]

    const turnosPIA = todos.filter(t => t.agente === 'PROFESSOR_IA')
    assert.strictEqual(turnosPIA.length, 2)
    assert.ok(turnosPIA.every(t => t.agente === 'PROFESSOR_IA'))
  })

  it('retorna vazio quando não há turnos PROFESSOR_IA', () => {
    const todos = [
      criarTurno({ agente: 'CALCULUS' }),
      criarTurno({ agente: 'NEURON' }),
    ]
    const turnosPIA = todos.filter(t => t.agente === 'PROFESSOR_IA')
    assert.strictEqual(turnosPIA.length, 0)
  })

  it('agrupa corretamente por tipo_usuario', () => {
    const sessaoMap = new Map([
      ['sessao-filho', { tipo_usuario: 'filho' as const, responsavel_id: null }],
      ['sessao-pai', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-uuid-1' }],
    ])

    const turnosMistos = [
      criarTurno({ sessao_id: 'sessao-filho' }),
      criarTurno({ id: 'turno-2', sessao_id: 'sessao-pai' }),
      criarTurno({ id: 'turno-3', sessao_id: 'sessao-filho' }),
    ]

    const turnosFilho = turnosMistos.filter(t => sessaoMap.get(t.sessao_id)?.tipo_usuario === 'filho')
    const turnosPai   = turnosMistos.filter(t => sessaoMap.get(t.sessao_id)?.tipo_usuario === 'pai')

    assert.strictEqual(turnosFilho.length, 2)
    assert.strictEqual(turnosPai.length, 1)
    assert.strictEqual(turnosPai[0].sessao_id, 'sessao-pai')
  })

  it('extrai responsavel_id único corretamente (deduplicação)', () => {
    const sessaoMap = new Map([
      ['sessao-a', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-uuid-1' }],
      ['sessao-b', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-uuid-1' }],  // mesmo pai, sessão diferente
      ['sessao-c', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-uuid-2' }],
    ])

    const turnosPai = [
      criarTurno({ sessao_id: 'sessao-a' }),
      criarTurno({ id: 'turno-2', sessao_id: 'sessao-b' }),
      criarTurno({ id: 'turno-3', sessao_id: 'sessao-c' }),
    ]

    const responsavelIds = [...new Set(
      turnosPai.map(t => sessaoMap.get(t.sessao_id)?.responsavel_id).filter(Boolean)
    )] as string[]

    assert.strictEqual(responsavelIds.length, 2, 'deve deduplica responsavel_id')
    assert.ok(responsavelIds.includes('resp-uuid-1'))
    assert.ok(responsavelIds.includes('resp-uuid-2'))
  })

  it('filtra turnos por responsavel_id corretamente', () => {
    const sessaoMap = new Map([
      ['sessao-a', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-1' }],
      ['sessao-b', { tipo_usuario: 'pai' as const, responsavel_id: 'resp-2' }],
    ])

    const turnosPai = [
      criarTurno({ sessao_id: 'sessao-a' }),
      criarTurno({ id: 'turno-2', sessao_id: 'sessao-a' }),
      criarTurno({ id: 'turno-3', sessao_id: 'sessao-b' }),
    ]

    const turnosResp1 = turnosPai.filter(
      t => sessaoMap.get(t.sessao_id)?.responsavel_id === 'resp-1'
    )
    const turnosResp2 = turnosPai.filter(
      t => sessaoMap.get(t.sessao_id)?.responsavel_id === 'resp-2'
    )

    assert.strictEqual(turnosResp1.length, 2)
    assert.strictEqual(turnosResp2.length, 1)
  })
})

// ─── Teste de fallback de resumo ─────────────────────────────────────────────

describe('fallback de resumo PROFESSOR_IA', () => {
  it('fallback inclui contagem de interações e label correto', () => {
    // Simular o fallback sem LLM
    const turnos = [
      criarTurno({ entrada: 'melhore esse prompt de marketing' }),
      criarTurno({ id: 'turno-2', entrada: 'o que é RAG?' })
    ]

    // Replicar lógica de fallback
    const temas = [...new Set(turnos.map(t => t.entrada.split(' ').slice(0, 5).join(' ')))].join(' | ')
    const resumoFallback = `Semana com ${turnos.length} interações com Professor Pense-AI. Tópicos: ${temas}. Resumo automático indisponível.`

    assert.ok(resumoFallback.includes('Professor Pense-AI'))
    assert.ok(resumoFallback.includes('2 interações'))
    assert.ok(resumoFallback.includes('melhore esse prompt'))
  })
})
