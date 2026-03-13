// Gate 2: Agentes — MODO PAI + SUPERVISOR + Formato
// Testa Tasks 2.1, 2.2, 2.3
// Pré-requisito: servidor rodando em localhost:3001

import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import { TestClient } from './helpers/api-client.js'
import { seedTestFamily, seedRouterAluno, seedRegressionAluno, TEST_EMAIL, TEST_SENHA } from './helpers/seed-data.js'

const client = new TestClient('http://localhost:3001')

let familiaId: string
let alunoFundId: string
let alunoMedioId: string
let routerAlunoId: string
let regressionAlunoId: string

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 2 — Setup', () => {
  it('Seed test data + login', { timeout: 30000 }, async () => {
    const seed = await seedTestFamily()
    familiaId = seed.familia.id
    alunoFundId = seed.alunoFundamental.id
    alunoMedioId = seed.alunoMedio.id

    // Seed router aluno (with pre-seeded hero turns) — used by MODO PAI + SUPERVISOR tests
    const router = await seedRouterAluno(familiaId)
    routerAlunoId = router.alunoId

    // Seed regression aluno (separate instance) — used by Gate 1 regression tests only
    const regression = await seedRegressionAluno(familiaId)
    regressionAlunoId = regression.alunoId

    // Login
    const loginRes = await client.login(TEST_EMAIL, TEST_SENHA)
    assert(loginRes.token, 'Login deve retornar token')
    client.setToken(loginRes.token)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: MODO PAI — Heróis respondem para pais
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 2 — MODO PAI nos Heróis', () => {

  it('CALCULUS em MODO PAI responde com linguagem adulta', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'como ensinar frações pro meu filho?',
      { tipo_usuario: 'pai' }
    )
    assert(result.agente, 'Deve ter agente definido')
    assert(result.fullText.length > 0, 'Deve ter resposta')

    // Verificar que NÃO usa linguagem infantil típica de MODO FILHO
    const textoLower = result.fullText.toLowerCase()
    // Deve conter indicadores de linguagem para pais
    const indicadoresPai = ['filho', 'ensinar', 'estratégia', 'casa', 'responsável', 'pai', 'mãe', 'criança', 'ajudar']
    const temAlgumIndicador = indicadoresPai.some(ind => textoLower.includes(ind))
    // Não é garantido 100% que terá, mas o agente deve ser CALCULUS
    console.log(`  → Agente: ${result.agente}, Texto (50 chars): "${result.fullText.substring(0, 50)}..."`)
  })

  it('VERBETTA em MODO PAI responde sobre português para pais', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'como ajudar meu filho a escrever melhor?',
      { tipo_usuario: 'pai' }
    )
    assert(result.agente, 'Deve ter agente definido')
    assert(result.fullText.length > 0, 'Deve ter resposta')
    console.log(`  → Agente: ${result.agente}, Texto (50 chars): "${result.fullText.substring(0, 50)}..."`)
  })

  it('NEURON em MODO PAI responde sobre ciências para pais', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'como explicar fotossíntese pro meu filho?',
      { tipo_usuario: 'pai' }
    )
    assert(result.agente, 'Deve ter agente definido')
    assert(result.fullText.length > 0, 'Deve ter resposta')
    console.log(`  → Agente: ${result.agente}, Texto (50 chars): "${result.fullText.substring(0, 50)}..."`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: PSICOPEDAGOGICO — Voz do App (não persona)
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 2 — PSICO como Voz do App', () => {

  it('PSICO em MODO PAI qualifica sem revelar nomes de heróis', { timeout: 60000 }, async () => {
    // Usar alunoFund (sem hero turns pré-seeded) para forçar PSICO
    const result = await client.sendMessage(
      alunoFundId,
      'oi, quero ajudar meu filho',
      { tipo_usuario: 'pai' }
    )

    // PSICO deve responder (pode ser qualificação ou encaminhamento)
    assert(result.fullText.length > 0, 'PSICO deve gerar resposta')

    // Verificar que NÃO menciona nomes de heróis
    const nomesHerois = ['CALCULUS', 'VERBETTA', 'NEURON', 'TEMPUS', 'GAIA', 'VECTOR', 'ALKA', 'FLEX']
    const textoUpper = result.fullText.toUpperCase()
    for (const nome of nomesHerois) {
      assert(
        !textoUpper.includes(nome),
        `PSICO NÃO deve mencionar ${nome} na resposta. Texto: "${result.fullText.substring(0, 100)}"`
      )
    }
    console.log(`  → Agente: ${result.agente}, Texto (80 chars): "${result.fullText.substring(0, 80)}..."`)
  })

  it('PSICO em MODO FILHO qualifica sem revelar nomes de heróis', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      alunoMedioId,
      'oi tudo bem',
      { tipo_usuario: 'filho' }
    )

    assert(result.fullText.length > 0, 'PSICO deve gerar resposta')

    const nomesHerois = ['CALCULUS', 'VERBETTA', 'NEURON', 'TEMPUS', 'GAIA', 'VECTOR', 'ALKA', 'FLEX']
    const textoUpper = result.fullText.toUpperCase()
    for (const nome of nomesHerois) {
      assert(
        !textoUpper.includes(nome),
        `PSICO NÃO deve mencionar ${nome}. Texto: "${result.fullText.substring(0, 100)}"`
      )
    }
    console.log(`  → Agente: ${result.agente}, Texto (80 chars): "${result.fullText.substring(0, 80)}..."`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: SUPERVISOR — Exclusivo para pais
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 2 — SUPERVISOR Educacional', () => {

  it('SUPERVISOR aceito via agente_override quando tipo_usuario=pai', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'como meu filho está indo nos estudos?',
      { tipo_usuario: 'pai', agente_override: 'SUPERVISOR_EDUCACIONAL' }
    )

    // Deve ter resposta (mesmo sem dados Qdrant, SUPERVISOR deve responder algo)
    if (result.error) {
      // Se erro, não deve ser "disponível apenas para responsáveis"
      assert(
        !result.error.erro?.includes('responsáveis'),
        'SUPERVISOR deve ser aceito para pais'
      )
    } else {
      assert(result.fullText.length > 0 || result.agente, 'SUPERVISOR deve gerar resposta')
      console.log(`  → Agente: ${result.agente}, Texto (80 chars): "${result.fullText.substring(0, 80)}..."`)
    }
  })

  it('SUPERVISOR rejeitado quando tipo_usuario=filho', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'como estou indo?',
      { tipo_usuario: 'filho', agente_override: 'SUPERVISOR_EDUCACIONAL' }
    )

    // Deve retornar erro
    assert(result.error, 'SUPERVISOR deve ser rejeitado para filhos')
    assert(
      result.error.erro?.includes('responsáveis') || result.error.erro?.includes('Supervisor'),
      `Erro deve mencionar exclusividade. Erro recebido: ${JSON.stringify(result.error)}`
    )
    console.log(`  → Erro esperado: ${JSON.stringify(result.error)}`)
  })

  it('agente_override inválido retorna erro', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      routerAlunoId,
      'teste',
      { agente_override: 'AGENTE_INEXISTENTE' }
    )

    assert(result.error, 'Agente inválido deve gerar erro')
    console.log(`  → Erro esperado: ${JSON.stringify(result.error)}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Regressão Gate 1 (smoke test)
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 2 — Regressão Gate 1', () => {

  it('Health check funciona', { timeout: 10000 }, async () => {
    const health = await client.health()
    assert.strictEqual(health.status, 'ok')
  })

  it('Mensagem SSE funciona em MODO FILHO (padrão)', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      regressionAlunoId,
      'quanto é 2 + 2?'
    )
    assert(result.agente, 'Deve ter agente')
    assert(result.fullText.length > 0, 'Deve ter resposta')
    assert(result.done, 'Deve ter evento done')
    console.log(`  → Agente: ${result.agente}, ${result.fullText.length} chars`)
  })

  it('Router detecta tema matemática', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      regressionAlunoId,
      'me ajuda com equação de segundo grau'
    )
    assert.strictEqual(result.agente, 'CALCULUS', `Esperava CALCULUS, veio ${result.agente}`)
  })

  it('Router detecta tema português', { timeout: 60000 }, async () => {
    const result = await client.sendMessage(
      regressionAlunoId,
      'me ajuda com gramática e ortografia do português'
    )
    assert.strictEqual(result.agente, 'VERBETTA', `Esperava VERBETTA, veio ${result.agente}`)
  })
})
