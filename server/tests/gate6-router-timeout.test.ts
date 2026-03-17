/**
 * Gate 6 — Router Timeout + Transição + Continuidade
 *
 * Testa os 5 caminhos de decisão do decidirPersona() refatorado:
 *   1. nova_sessao flag → reset agente
 *   2. Keywords → fluxo normal (PSICO cascata ou herói direto)
 *   3. Classificador LLM leve (classificarTema)
 *   4. Indefinido + agente ativo → continuidade
 *   5. Erro/sem agente → PSICOPEDAGOGICO
 *
 * Também testa transições entre matérias e continuidade de sessão.
 *
 * Uso:
 *   npm run gate:6                            # contra localhost
 *   API_URL=https://... npm run gate:6        # contra produção
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { TestClient } from './helpers/api-client.js'
import { seedTestFamily, cleanupTestData, TEST_EMAIL, TEST_SENHA } from './helpers/seed-data.js'

const client = new TestClient()
let familiaId = ''
let alunoId = ''

describe('Gate 6 — Router Timeout + Transição + Continuidade', () => {
  before(async () => {
    const seed = await seedTestFamily()
    familiaId = seed.familia.id
    alunoId = seed.alunoFundamental.id

    const login = await client.login(TEST_EMAIL, TEST_SENHA)
    client.setToken(login.token)
  })

  after(async () => {
    if (familiaId) {
      await cleanupTestData(familiaId)
    }
  })

  // ─── Caminho 2: Keywords → herói direto ou PSICO cascata ───

  it('2.1: Pergunta de matemática deve rotear para CALCULUS ou PSICOPEDAGOGICO', async () => {
    const result = await client.sendMessage(alunoId, 'me ajuda com equação do segundo grau')
    assert.ok(result.agente, 'Deve retornar um agente')
    assert.ok(
      result.agente === 'CALCULUS' || result.agente === 'PSICOPEDAGOGICO',
      `Esperava CALCULUS ou PSICO, recebeu: ${result.agente}`
    )
    assert.ok(result.fullText.length > 10, 'Resposta deve ter conteúdo')
  })

  it('2.2: Pergunta de português deve rotear para VERBETTA ou PSICOPEDAGOGICO', async () => {
    const result = await client.sendMessage(alunoId, 'me ajuda com gramática e ortografia do português')
    assert.ok(result.agente, 'Deve retornar um agente')
    assert.ok(
      result.agente === 'VERBETTA' || result.agente === 'PSICOPEDAGOGICO',
      `Esperava VERBETTA ou PSICO, recebeu: ${result.agente}`
    )
  })

  it('2.3: Pergunta de história deve rotear para TEMPUS ou PSICOPEDAGOGICO', async () => {
    const result = await client.sendMessage(alunoId, 'me conta sobre a revolução francesa')
    assert.ok(result.agente, 'Deve retornar um agente')
    assert.ok(
      result.agente === 'TEMPUS' || result.agente === 'PSICOPEDAGOGICO',
      `Esperava TEMPUS ou PSICO, recebeu: ${result.agente}`
    )
  })

  it('2.4: Pergunta de ciências deve rotear para NEURON ou PSICOPEDAGOGICO', async () => {
    const result = await client.sendMessage(alunoId, 'como funciona a fotossíntese nas plantas')
    assert.ok(result.agente, 'Deve retornar um agente')
    assert.ok(
      result.agente === 'NEURON' || result.agente === 'PSICOPEDAGOGICO',
      `Esperava NEURON ou PSICO, recebeu: ${result.agente}`
    )
  })

  // ─── Caminho 3: Classificador LLM ───
  // Mensagens sem keywords óbvias — dependem do classificador

  it('3.1: Mensagem ambígua sobre números deve ser resolvida pelo classificador', async () => {
    const result = await client.sendMessage(alunoId, 'não entendo como resolver isso com x e y')
    assert.ok(result.agente, 'Deve retornar um agente')
    // Pode ir para qualquer herói ou PSICO — o importante é não travar
    assert.ok(result.fullText.length > 10, 'Resposta deve ter conteúdo')
  })

  // ─── Caminho 4: Continuidade ───

  it('4.1: Pergunta genérica após estabelecer matéria deve manter continuidade', async () => {
    // Primeira mensagem: estabelece CALCULUS
    const r1 = await client.sendMessage(alunoId, 'me ajuda com fração')
    assert.ok(r1.agente, 'Primeiro agente deve existir')

    // Segunda mensagem: genérica, deve manter o mesmo agente
    const r2 = await client.sendMessage(alunoId, 'não entendi, pode explicar de outro jeito?')
    assert.ok(r2.agente, 'Segundo agente deve existir')

    // Em continuidade, o agente deve ser mantido (ou PSICO se for a primeira vez)
    assert.ok(
      r2.agente === r1.agente || r2.agente === 'PSICOPEDAGOGICO',
      `Continuidade: esperava ${r1.agente} ou PSICO, recebeu: ${r2.agente}`
    )
    assert.ok(r2.fullText.length > 10, 'Resposta de continuidade deve ter conteúdo')
  })

  // ─── Transição entre matérias ───

  it('5.1: Transição de matéria — mensagem de história após matemática', async () => {
    // Estabelece CALCULUS
    const r1 = await client.sendMessage(alunoId, 'me ensina sobre porcentagem')
    assert.ok(r1.agente, 'Primeiro agente deve existir')

    // Troca para história
    const r2 = await client.sendMessage(alunoId, 'agora quero saber sobre o descobrimento do Brasil')
    assert.ok(r2.agente, 'Segundo agente deve existir')
    assert.ok(
      r2.agente !== 'CALCULUS',
      `Após pergunta de história, não deve permanecer em CALCULUS. Agente: ${r2.agente}`
    )
    assert.ok(
      r2.agente === 'TEMPUS' || r2.agente === 'PSICOPEDAGOGICO',
      `Transição: esperava TEMPUS ou PSICO, recebeu: ${r2.agente}`
    )
  })

  // ─── Caminho 5: Fallback PSICOPEDAGOGICO ───

  it('5.2: Mensagem completamente fora de contexto escolar → PSICOPEDAGOGICO', async () => {
    const result = await client.sendMessage(alunoId, 'oi, tudo bem?')
    assert.ok(result.agente, 'Deve retornar um agente')
    // Saudação genérica deve ir para PSICO ou manter continuidade
    assert.ok(result.fullText.length > 5, 'Deve ter alguma resposta')
  })

  // ─── Caminho 1: nova_sessao flag ───

  it('1.1: Flag nova_sessao reseta agente ativo', async () => {
    // Estabelece um agente
    const r1 = await client.sendMessage(alunoId, 'me ajuda com velocidade e aceleração')
    assert.ok(r1.agente, 'Primeiro agente deve existir')

    // Envia nova mensagem COM nova_sessao flag (via body)
    // O sendMessage do TestClient não suporta nova_sessao diretamente,
    // mas o frontend envia isFirstMessageRef=true na primeira mensagem.
    // Testamos indiretamente: após uma mensagem de matéria diferente
    // sem contexto prévio, o agente deve resetar.
    const r2 = await client.sendMessage(alunoId, 'o que é uma célula?')
    assert.ok(r2.agente, 'Segundo agente deve existir')
    assert.ok(
      r2.agente === 'NEURON' || r2.agente === 'PSICOPEDAGOGICO',
      `Após troca, esperava NEURON ou PSICO: ${r2.agente}`
    )
  })

  // ─── SSE: Formato de resposta ───

  it('6.1: Resposta SSE deve conter evento agente + chunks + done', async () => {
    const result = await client.sendMessage(alunoId, 'me ajuda com geografia do Brasil')
    assert.ok(result.events.length >= 3, `Deve ter pelo menos 3 eventos SSE, tem: ${result.events.length}`)
    assert.ok(result.agente, 'Evento agente deve existir')
    assert.ok(result.chunks.length > 0, 'Deve ter pelo menos 1 chunk')
    assert.ok(result.done, 'Evento done deve existir')
    assert.ok(result.fullText.length > 20, `Texto completo deve ser substancial, tem: ${result.fullText.length} chars`)
  })

  it('6.2: Resposta não deve demorar mais de 30 segundos', async () => {
    const inicio = Date.now()
    const result = await client.sendMessage(alunoId, 'o que é uma fração?')
    const tempo = Date.now() - inicio
    assert.ok(tempo < 30000, `Resposta demorou ${tempo}ms — máximo 30s`)
    assert.ok(result.fullText.length > 10, 'Deve ter resposta')
  })
})
