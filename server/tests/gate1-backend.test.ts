import 'dotenv/config'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { TestClient } from './helpers/api-client.js'
import { seedTestFamily, cleanupTestData, seedRouterAluno, TEST_EMAIL, TEST_SENHA, TEST_PIN } from './helpers/seed-data.js'

// ============================================================
// GATE 1: FUNDAÇÃO BACKEND
// ============================================================

describe('GATE 1: Backend Foundation', () => {
  const client = new TestClient()
  let testData: any = null
  let token: string | null = null

  let routerAlunoId: string

  before(async () => {
    console.log('\n[SETUP] Seeding test data...')
    testData = await seedTestFamily()
    console.log(`[SETUP] Test familia created: ${testData.familia.id}`)
    console.log(`[SETUP] Aluno Fundamental: ${testData.alunoFundamental.id}`)
    console.log(`[SETUP] Aluno Médio: ${testData.alunoMedio.id}`)

    // Create dedicated aluno for router tests (isolated from Message SSE tests)
    const routerData = await seedRouterAluno(testData.familia.id)
    routerAlunoId = routerData.alunoId
    console.log(`[SETUP] Router aluno created: ${routerAlunoId} (sessao: ${routerData.sessaoId})`)
  })

  after(async () => {
    if (testData?.familia?.id) {
      console.log('\n[TEARDOWN] Cleaning up test data...')
      await cleanupTestData(testData.familia.id)
      console.log('[TEARDOWN] Cleanup complete')
    }
  })

  // ============================================================
  // 1. HEALTH CHECK
  // ============================================================

  describe('Health Check', () => {
    it('GET /api/health returns 200 + status ok', async () => {
      const health = await client.health()
      assert.strictEqual(health.status, 'ok')
      assert(health.timestamp)
      assert(health.version)
    })
  })

  // ============================================================
  // 2. AUTH
  // ============================================================

  describe('Authentication', () => {
    it('POST /api/auth/login with valid credentials returns JWT + data', async () => {
      const response = await client.login(TEST_EMAIL, TEST_SENHA)

      assert(response.token)
      assert(response.familia)
      assert.strictEqual(response.familia.email, TEST_EMAIL)
      assert(response.filhos)
      assert(response.filhos.length >= 2, `Expected at least 2 filhos, got ${response.filhos.length}`)
      assert(response.responsavel)
      assert.strictEqual(response.responsavel.nome, 'Responsável Teste')

      token = response.token
      client.setToken(token)
    })

    it('POST /api/auth/login with wrong password returns 401', async () => {
      try {
        await client.login(TEST_EMAIL, 'wrong_password')
        assert.fail('Should have thrown error')
      } catch (err: any) {
        assert(err.message.includes('invalid credentials'))
      }
    })

    it('POST /api/auth/select-profile tipo=filho returns sessao', async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)

      const response = await client.selectProfile(testData.alunoFundamental.id, 'filho')

      assert(response.sessao)
      assert(response.tipo_interface)
      assert(response.aluno)
      assert.strictEqual(response.aluno.id, testData.alunoFundamental.id)
    })

    it('POST /api/auth/select-profile tipo=pai with correct PIN returns sessao', async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)

      const response = await client.selectProfile(testData.responsavel.id, 'pai', TEST_PIN)

      assert(response.sessao)
      assert.strictEqual(response.tipo_interface, 'pai')
    })

    it('POST /api/auth/select-profile tipo=pai with wrong PIN returns 403', async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)

      try {
        await client.selectProfile(testData.responsavel.id, 'pai', 'wrong_pin')
        assert.fail('Should have thrown error')
      } catch (err: any) {
        assert(err.message)
      }
    })

    it('tipo_interface = fundamental for aluno serie 5º ano', async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)

      const response = await client.selectProfile(testData.alunoFundamental.id, 'filho')

      assert.strictEqual(response.tipo_interface, 'fundamental')
    })

    it('tipo_interface = medio for aluno serie 2º EM', async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)

      const response = await client.selectProfile(testData.alunoMedio.id, 'filho')

      assert.strictEqual(response.tipo_interface, 'medio')
    })
  })

  // ============================================================
  // 3. MESSAGE (SSE) — Integration tests with real LLM
  // ============================================================

  describe('Message (SSE)', () => {
    before(async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)
      await client.selectProfile(testData.alunoFundamental.id, 'filho')
    })

    it('POST /api/message without auth returns 401', async () => {
      const noAuthClient = new TestClient()
      try {
        await noAuthClient.sendMessageRaw(testData.alunoFundamental.id, 'oi')
        assert.fail('Should have thrown error')
      } catch (err: any) {
        assert(err.message.includes('401') || err.message.includes('unauthorized') || err.message.includes('Unauthorized'))
      }
    })

    it('POST /api/message with "olá" returns valid SSE stream', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(testData.alunoFundamental.id, 'olá')

      assert(result.events.length > 0, 'Should have SSE events')
      assert(result.fullText.length > 0, 'Should have response text')
      assert(!result.error, `Should not have error: ${JSON.stringify(result.error)}`)
    })

    it('SSE stream contains event:agente with valid persona', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(testData.alunoFundamental.id, 'olá')

      assert(result.agente, 'Should have agente event')
      const validAgentes = [
        'CALCULUS', 'VERBETTA', 'NEURON', 'TEMPUS',
        'GAIA', 'VECTOR', 'ALKA', 'FLEX', 'PSICOPEDAGOGICO'
      ]
      assert(validAgentes.includes(result.agente), `Agente ${result.agente} should be valid`)
    })

    it('SSE stream contains event:chunk with texto', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(testData.alunoFundamental.id, 'oi, tudo bem?')

      assert(result.chunks.length > 0, 'Should have chunk events')
      for (const chunk of result.chunks) {
        assert(typeof chunk === 'string', 'Chunk should be string')
      }
    })

    it('SSE stream terminates with event:done', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(testData.alunoFundamental.id, 'como você está?')

      assert(result.done, 'Should have done event')
      // Done event contains: agente, turno, tempo_ms, metricas
      assert(result.done.agente, 'Done should have agente')
      assert(typeof result.done.tempo_ms === 'number', 'Done should have tempo_ms')
    })
  })

  // ============================================================
  // 4. ROUTER — Test via SSE responses
  // Pre-seeded turns ensure heroes are "already attended",
  // so router goes DIRECTLY to hero (no PSICO cascata)
  // ============================================================

  describe('Router (Persona Detection)', () => {
    // Uses dedicated routerAlunoId with pre-seeded hero turns
    // Isolated from Message SSE tests to avoid state contamination
    before(async () => {
      await client.login(TEST_EMAIL, TEST_SENHA)
      await client.selectProfile(routerAlunoId, 'filho')
    })

    it('Message "ajuda com frações" → agente CALCULUS', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'ajuda com frações')

      assert.strictEqual(result.agente, 'CALCULUS', `Expected CALCULUS, got ${result.agente}`)
    })

    it('Message "redação" → agente VERBETTA', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'me ajuda com redação')

      assert.strictEqual(result.agente, 'VERBETTA', `Expected VERBETTA, got ${result.agente}`)
    })

    it('Message "célula" → agente NEURON', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'o que é célula')

      assert.strictEqual(result.agente, 'NEURON', `Expected NEURON, got ${result.agente}`)
    })

    it('Message "independência do brasil" → agente TEMPUS', { timeout: 60000 }, async () => {
      // Nota: "revolução" contém substring "evolução" (ciências) — usar keyword sem ambiguidade
      const result = await client.sendMessage(routerAlunoId, 'independência do brasil na história')

      assert.strictEqual(result.agente, 'TEMPUS', `Expected TEMPUS, got ${result.agente}`)
    })

    it('Message "biomas" → agente GAIA', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'quais são os biomas')

      assert.strictEqual(result.agente, 'GAIA', `Expected GAIA, got ${result.agente}`)
    })

    it('Message "velocidade" → agente VECTOR', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'o que é velocidade na física')

      assert.strictEqual(result.agente, 'VECTOR', `Expected VECTOR, got ${result.agente}`)
    })

    it('Message "tabela periódica" → agente ALKA', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'me explica a tabela periódica')

      assert.strictEqual(result.agente, 'ALKA', `Expected ALKA, got ${result.agente}`)
    })

    it('Message "verb to be" → agente FLEX', { timeout: 60000 }, async () => {
      const result = await client.sendMessage(routerAlunoId, 'teach me verb to be in english')

      assert.strictEqual(result.agente, 'FLEX', `Expected FLEX, got ${result.agente}`)
    })
  })
})
