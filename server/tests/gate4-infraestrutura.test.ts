// Gate 4 — Infraestrutura: CRON, Qdrant, Limites, Dispositivos
import 'dotenv/config'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Import modules under test
import { calcularSemanaISO } from '../src/core/cron.js'
import { qdrantConfigurado } from '../src/db/qdrant.js'
import {
  incrementarUso,
  verificarLimiteAtingido,
  incrementarTurnoCompleto,
  buscarUsoDiario
} from '../src/db/usage-queries.js'
import {
  registrarDispositivo,
  verificarLimiteDispositivos,
  limparDispositivosInativos
} from '../src/core/dispositivos.js'

// Note: These are integration tests that hit Supabase.
// Uses real Supabase but with test data that gets cleaned up.

const TEST_ALUNO_ID = process.env.TEST_ALUNO_ID || ''
const TEST_FAMILIA_ID = process.env.TEST_FAMILIA_ID || ''

describe('Gate 4 — Infraestrutura', () => {

  // ─── CRON ───────────────────────────────────────────────────
  describe('4.1 CRON', () => {
    it('calcularSemanaISO retorna formato correto', () => {
      const semana = calcularSemanaISO(new Date('2026-03-13'))
      assert.match(semana, /^\d{4}-W\d{2}$/, 'Formato deve ser YYYY-WNN')
    })

    it('CRON module exports registrarCronSemanal', async () => {
      const mod = await import('../src/core/cron.js')
      assert.equal(typeof mod.registrarCronSemanal, 'function')
      assert.equal(typeof mod.executarFlushSemanal, 'function')
    })
  })

  // ─── QDRANT ─────────────────────────────────────────────────
  describe('4.2 Qdrant', () => {
    it('qdrantConfigurado retorna boolean', () => {
      const resultado = qdrantConfigurado()
      assert.equal(typeof resultado, 'boolean')
    })

    it('qdrant module exports funções essenciais', async () => {
      const mod = await import('../src/db/qdrant.js')
      assert.equal(typeof mod.inicializarQdrant, 'function')
      assert.equal(typeof mod.gerarEmbedding, 'function')
      assert.equal(typeof mod.salvarEmbeddingSemanal, 'function')
      assert.equal(typeof mod.buscarContextoLongoPrazo, 'function')
    })
  })

  // ─── DISPOSITIVOS ──────────────────────────────────────────
  describe('4.3 Dispositivos', () => {
    const tokenBase = `test-device-${Date.now()}`

    it('registrar dispositivo não lança erro', async () => {
      if (!TEST_FAMILIA_ID) return assert.ok(true, 'Skip: sem TEST_FAMILIA_ID')
      await assert.doesNotReject(
        registrarDispositivo(TEST_FAMILIA_ID, 'test-perfil', 'filho', `${tokenBase}-1`)
      )
    })

    it('verificarLimiteDispositivos retorna formato correto', async () => {
      if (!TEST_FAMILIA_ID) return assert.ok(true, 'Skip: sem TEST_FAMILIA_ID')
      const result = await verificarLimiteDispositivos(TEST_FAMILIA_ID)
      assert.equal(typeof result.permitido, 'boolean')
      assert.equal(typeof result.ativos, 'number')
      assert.equal(typeof result.limite, 'number')
    })

    it('limparDispositivosInativos retorna número', async () => {
      const removidos = await limparDispositivosInativos()
      assert.equal(typeof removidos, 'number')
    })

    it('dispositivos module exporta middlewareDispositivos', async () => {
      const mod = await import('../src/core/dispositivos.js')
      assert.equal(typeof mod.middlewareDispositivos, 'function')
    })
  })

  // ─── LIMITES ────────────────────────────────────────────────
  describe('4.4 Limites', () => {
    it('verificarLimiteAtingido usa turnos_completos (não turnos)', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      const result = await verificarLimiteAtingido(TEST_ALUNO_ID)
      assert.ok('turnos_completos' in result, 'Deve ter campo turnos_completos')
      assert.ok(!('turnos' in result), 'Não deve ter campo turnos (antigo)')
    })

    it('incrementarTurnoCompleto é uma função', () => {
      assert.equal(typeof incrementarTurnoCompleto, 'function')
    })

    it('incrementarUso funciona sem erro', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      await assert.doesNotReject(incrementarUso(TEST_ALUNO_ID))
    })

    it('buscarUsoDiario retorna dados corretos', async () => {
      if (!TEST_ALUNO_ID) return assert.ok(true, 'Skip: sem TEST_ALUNO_ID')
      const uso = await buscarUsoDiario(TEST_ALUNO_ID)
      if (uso) {
        assert.ok('turnos_completos' in uso, 'Deve ter turnos_completos')
        assert.equal(typeof uso.interacoes, 'number')
      }
    })
  })
})
