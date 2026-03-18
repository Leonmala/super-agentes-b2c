// ============================================================
// GATE BLOCO H — Teste E2E Completo com Respostas
// Imprime TODA resposta para avaliação humana
// ============================================================

import { TestClient } from './helpers/api-client.js'

const API_URL = process.env.API_URL || 'https://independent-eagerness-production-7da9.up.railway.app'
const EMAIL = 'leon@pense-ai.com'
const SENHA = '3282'
const PIN = '3282'

const HEROIS: Array<{ nome: string; msg_filho: string; msg_pai: string }> = [
  { nome: 'CALCULUS', msg_filho: 'me ajuda com frações', msg_pai: 'como ensinar frações pro meu filho' },
  { nome: 'VERBETTA', msg_filho: 'quando usar crase', msg_pai: 'como ajudar meu filho com crase' },
  { nome: 'NEURON', msg_filho: 'o que é fotossíntese', msg_pai: 'como explicar fotossíntese pro meu filho' },
  { nome: 'TEMPUS', msg_filho: 'me conta sobre a independência do Brasil', msg_pai: 'como ensinar história da independência' },
  { nome: 'GAIA', msg_filho: 'quais são os biomas do Brasil', msg_pai: 'como ensinar biomas brasileiros' },
  { nome: 'VECTOR', msg_filho: 'o que é velocidade e aceleração', msg_pai: 'como explicar física de velocidade' },
  { nome: 'ALKA', msg_filho: 'o que é uma reação química', msg_pai: 'como ensinar reações químicas' },
  { nome: 'FLEX', msg_filho: 'how do I say bom dia in english', msg_pai: 'como ajudar meu filho com inglês básico' },
]

const JSON_LEAK_PATTERNS = [
  { pattern: /"agent_id"\s*:/, label: 'agent_id' },
  { pattern: /"reply_text"\s*:/, label: 'reply_text' },
  { pattern: /"sinal_psicopedagogico"\s*:/, label: 'sinal_psicopedagogico' },
  { pattern: /"motivo_sinal"\s*:/, label: 'motivo_sinal' },
  { pattern: /"observacoes_internas"\s*:/, label: 'observacoes_internas' },
  { pattern: /"acao"\s*:\s*"ENCAMINHAR/, label: 'acao_ENCAMINHAR' },
  { pattern: /"heroi_escolhido"\s*:/, label: 'heroi_escolhido' },
  { pattern: /"plano_atendimento"\s*:/, label: 'plano_atendimento' },
  { pattern: /"instrucoes_para_heroi"\s*:/, label: 'instrucoes_para_heroi' },
  { pattern: /"resposta_para_aluno"\s*:/, label: 'resposta_para_aluno' },
]

function detectLeaks(text: string): string[] {
  const found: string[] = []
  for (const { pattern, label } of JSON_LEAK_PATTERNS) {
    if (pattern.test(text)) found.push(label)
  }
  return found
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

interface Resultado {
  heroi: string
  modo: 'FILHO' | 'PAI'
  pergunta: string
  agente_retornado: string | null
  resposta: string
  tempo_ms: number
  leaks: string[]
  status: 'OK' | 'FALHOU' | 'LIMITE' | 'ERRO'
  erro?: string
}

async function main() {
  console.log(`\n🧪 GATE BLOCO H — Teste E2E Completo`)
  console.log(`   URL: ${API_URL}`)
  console.log(`   ${new Date().toISOString()}\n`)

  const client = new TestClient(API_URL)
  const login = await client.login(EMAIL, SENHA)
  console.log(`✅ Login OK — ${login.filhos[0].nome}\n`)

  const filhoId = login.filhos[0].id
  const responsavelId = login.responsavel?.id

  // Selecionar perfil filho
  await client.selectProfile(filhoId, 'filho')

  const resultados: Resultado[] = []

  // ── MODO FILHO ──
  console.log('══════════════════════════════════════════════════')
  console.log('  🧒 MODO FILHO')
  console.log('══════════════════════════════════════════════════\n')

  for (const h of HEROIS) {
    console.log(`─── ${h.nome} (filho) ───`)
    console.log(`📝 Pergunta: "${h.msg_filho}"`)

    try {
      const r = await client.sendMessage(filhoId, h.msg_filho, { tipo_usuario: 'filho' })

      if (r.fullText.length === 0 && r.events.some(e => e.event === 'limite')) {
        console.log(`⚠️  LIMITE ATINGIDO`)
        resultados.push({ heroi: h.nome, modo: 'FILHO', pergunta: h.msg_filho, agente_retornado: null, resposta: '', tempo_ms: 0, leaks: [], status: 'LIMITE' })
        continue
      }

      const leaks = detectLeaks(r.fullText)
      const status = r.fullText.length > 10 && r.agente && r.done && !r.error && leaks.length === 0 ? 'OK' : 'FALHOU'

      console.log(`🤖 Agente: ${r.agente || 'N/A'}`)
      console.log(`⏱️  Tempo: ${r.done?.tempo_ms || '?'}ms`)
      console.log(`📤 Resposta (${r.fullText.length} chars):`)
      console.log(`┌──────────────────────────────────────────`)
      console.log(r.fullText.split('\n').map(l => `│ ${l}`).join('\n'))
      console.log(`└──────────────────────────────────────────`)
      if (leaks.length > 0) console.log(`🚨 LEAKS: ${leaks.join(', ')}`)
      console.log(`${status === 'OK' ? '✅' : '❌'} ${status}\n`)

      resultados.push({
        heroi: h.nome, modo: 'FILHO', pergunta: h.msg_filho,
        agente_retornado: r.agente, resposta: r.fullText,
        tempo_ms: r.done?.tempo_ms || 0, leaks, status
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`💥 ERRO: ${msg}\n`)
      resultados.push({ heroi: h.nome, modo: 'FILHO', pergunta: h.msg_filho, agente_retornado: null, resposta: '', tempo_ms: 0, leaks: [], status: 'ERRO', erro: msg })
    }

    await sleep(1500)
  }

  // ── MODO PAI ──
  console.log('\n══════════════════════════════════════════════════')
  console.log('  👨 MODO PAI')
  console.log('══════════════════════════════════════════════════\n')

  if (responsavelId) {
    await client.selectProfile(responsavelId, 'pai', PIN)
    console.log('✅ Perfil pai selecionado\n')
  }

  for (const h of HEROIS) {
    console.log(`─── ${h.nome} (pai) ───`)
    console.log(`📝 Pergunta: "${h.msg_pai}"`)

    try {
      const r = await client.sendMessage(filhoId, h.msg_pai, { tipo_usuario: 'pai' })

      if (r.fullText.length === 0 && r.events.some(e => e.event === 'limite')) {
        console.log(`⚠️  LIMITE ATINGIDO`)
        resultados.push({ heroi: h.nome, modo: 'PAI', pergunta: h.msg_pai, agente_retornado: null, resposta: '', tempo_ms: 0, leaks: [], status: 'LIMITE' })
        continue
      }

      const leaks = detectLeaks(r.fullText)
      const status = r.fullText.length > 10 && r.agente && r.done && !r.error && leaks.length === 0 ? 'OK' : 'FALHOU'

      console.log(`🤖 Agente: ${r.agente || 'N/A'}`)
      console.log(`⏱️  Tempo: ${r.done?.tempo_ms || '?'}ms`)
      console.log(`📤 Resposta (${r.fullText.length} chars):`)
      console.log(`┌──────────────────────────────────────────`)
      console.log(r.fullText.split('\n').map(l => `│ ${l}`).join('\n'))
      console.log(`└──────────────────────────────────────────`)
      if (leaks.length > 0) console.log(`🚨 LEAKS: ${leaks.join(', ')}`)
      console.log(`${status === 'OK' ? '✅' : '❌'} ${status}\n`)

      resultados.push({
        heroi: h.nome, modo: 'PAI', pergunta: h.msg_pai,
        agente_retornado: r.agente, resposta: r.fullText,
        tempo_ms: r.done?.tempo_ms || 0, leaks, status
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`💥 ERRO: ${msg}\n`)
      resultados.push({ heroi: h.nome, modo: 'PAI', pergunta: h.msg_pai, agente_retornado: null, resposta: '', tempo_ms: 0, leaks: [], status: 'ERRO', erro: msg })
    }

    await sleep(1500)
  }

  // ── RESUMO FINAL ──
  const okFilho = resultados.filter(r => r.modo === 'FILHO' && r.status === 'OK').length
  const okPai = resultados.filter(r => r.modo === 'PAI' && r.status === 'OK').length
  const limites = resultados.filter(r => r.status === 'LIMITE').length
  const falhas = resultados.filter(r => r.status === 'FALHOU' || r.status === 'ERRO').length
  const totalLeaks = resultados.reduce((sum, r) => sum + r.leaks.length, 0)

  console.log('\n══════════════════════════════════════════════════')
  console.log('  📊 RESULTADO FINAL — GATE BLOCO H')
  console.log('══════════════════════════════════════════════════')
  console.log(`  MODO FILHO:  ${okFilho}/8 ✅`)
  console.log(`  MODO PAI:    ${okPai}/8 ✅`)
  console.log(`  LIMITES:     ${limites} (não contam como falha)`)
  console.log(`  FALHAS:      ${falhas}`)
  console.log(`  JSON LEAKS:  ${totalLeaks} ${totalLeaks === 0 ? '✅ ZERO!' : '❌'}`)

  // Tabela resumo
  console.log('\n  ┌──────────┬────────┬────────┬──────────┬────────┐')
  console.log('  │ Herói    │ Filho  │ Pai    │ Tempo(s) │ Leaks  │')
  console.log('  ├──────────┼────────┼────────┼──────────┼────────┤')
  for (const h of HEROIS) {
    const f = resultados.find(r => r.heroi === h.nome && r.modo === 'FILHO')
    const p = resultados.find(r => r.heroi === h.nome && r.modo === 'PAI')
    const fStatus = f?.status === 'OK' ? '✅' : f?.status === 'LIMITE' ? '⏸️' : '❌'
    const pStatus = p?.status === 'OK' ? '✅' : p?.status === 'LIMITE' ? '⏸️' : '❌'
    const tempo = ((f?.tempo_ms || 0) + (p?.tempo_ms || 0)) / 1000
    const leaks = (f?.leaks.length || 0) + (p?.leaks.length || 0)
    console.log(`  │ ${h.nome.padEnd(8)} │ ${fStatus.padEnd(6)} │ ${pStatus.padEnd(6)} │ ${tempo.toFixed(1).padStart(8)} │ ${String(leaks).padStart(6)} │`)
  }
  console.log('  └──────────┴────────┴────────┴──────────┴────────┘')
  console.log('══════════════════════════════════════════════════\n')

  if (falhas > 0 || totalLeaks > 0) {
    process.exit(1)
  }
}

main().catch(e => { console.error('💥 FATAL:', e.message); process.exit(1) })
