// ============================================================
// GATE BLOCO H — Teste E2E em Produção
// Testa os 8 heróis em MODO FILHO e MODO PAI
// Valida que JSON NUNCA vaza ao aluno/pai (disjuntores ativos)
// ============================================================

import { TestClient } from './helpers/api-client.js'

const API_URL = process.env.API_URL || 'https://independent-eagerness-production-7da9.up.railway.app'
const EMAIL = 'leon@pense-ai.com'
const SENHA = '3282'
const PIN = '3282'

// Mensagens que ativam cada herói
const HEROIS: Array<{
  nome: string
  mensagem_filho: string
  mensagem_pai: string
}> = [
  { nome: 'CALCULUS', mensagem_filho: 'me ajuda com frações', mensagem_pai: 'como ensinar frações pro meu filho' },
  { nome: 'VERBETTA', mensagem_filho: 'quando usar crase', mensagem_pai: 'como ajudar meu filho com crase' },
  { nome: 'NEURON', mensagem_filho: 'o que é fotossíntese', mensagem_pai: 'como explicar fotossíntese pro meu filho' },
  { nome: 'TEMPUS', mensagem_filho: 'me conta sobre a independência do Brasil', mensagem_pai: 'como ensinar história da independência' },
  { nome: 'GAIA', mensagem_filho: 'quais são os biomas do Brasil', mensagem_pai: 'como ensinar biomas brasileiros' },
  { nome: 'VECTOR', mensagem_filho: 'o que é velocidade e aceleração', mensagem_pai: 'como explicar física de velocidade' },
  { nome: 'ALKA', mensagem_filho: 'o que é uma reação química', mensagem_pai: 'como ensinar reações químicas' },
  { nome: 'FLEX', mensagem_filho: 'how do I say bom dia in english', mensagem_pai: 'como ajudar meu filho com inglês básico' },
]

// Padrões que indicam JSON vazando (NUNCA devem aparecer no texto do aluno)
const JSON_LEAK_PATTERNS = [
  /"agent_id"\s*:/,
  /"reply_text"\s*:/,
  /"sinal_psicopedagogico"\s*:/,
  /"motivo_sinal"\s*:/,
  /"observacoes_internas"\s*:/,
  /"acao"\s*:\s*"ENCAMINHAR/,
  /"heroi_escolhido"\s*:/,
  /"plano_atendimento"\s*:/,
  /"instrucoes_para_heroi"\s*:/,
  /"resposta_para_aluno"\s*:/,
  /^\s*\{[\s\S]*"agent_id"/m,
]

function checkJSONLeak(text: string, context: string): boolean {
  for (const pattern of JSON_LEAK_PATTERNS) {
    if (pattern.test(text)) {
      console.error(`  ❌ JSON LEAK detectado em ${context}!`)
      console.error(`     Pattern: ${pattern}`)
      console.error(`     Texto (primeiros 200 chars): ${text.substring(0, 200)}`)
      return true
    }
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rodarTestes() {
  console.log(`\n🧪 GATE BLOCO H — Teste E2E em Produção`)
  console.log(`   URL: ${API_URL}`)
  console.log(`   Data: ${new Date().toISOString()}\n`)

  const client = new TestClient(API_URL)

  // ── Login ──
  console.log('📡 Autenticando...')
  const loginData = await client.login(EMAIL, SENHA)
  console.log(`  ✅ Login OK — família: ${loginData.familia.id}`)

  const filhos = loginData.filhos
  if (filhos.length === 0) {
    throw new Error('Nenhum filho encontrado na família de teste')
  }

  const filhoTeste = filhos[0]
  const responsavelId = loginData.responsavel?.id
  console.log(`  👦 Filho: ${filhoTeste.nome} (${filhoTeste.serie}) — ID: ${filhoTeste.id}`)
  console.log(`  👨 Responsável ID: ${responsavelId}`)

  // Selecionar perfil filho
  await client.selectProfile(filhoTeste.id, 'filho')
  console.log(`  ✅ Perfil filho selecionado\n`)

  let passouFilho = 0
  let passouPai = 0
  let falhouFilho = 0
  let falhouPai = 0
  let jsonLeaks = 0

  // ── MODO FILHO: 8 heróis ──
  console.log('═══════════════════════════════════════════')
  console.log('  MODO FILHO — Testando 8 heróis')
  console.log('═══════════════════════════════════════════\n')

  for (const heroi of HEROIS) {
    console.log(`🦸 ${heroi.nome} (filho): "${heroi.mensagem_filho}"`)

    try {
      const result = await client.sendMessage(
        filhoTeste.id,
        heroi.mensagem_filho,
        { tipo_usuario: 'filho' }
      )

      const temTexto = result.fullText.length > 10
      const temAgente = result.agente !== null
      const temDone = result.done !== null
      const semErro = result.error === null
      const temLeak = checkJSONLeak(result.fullText, `${heroi.nome} FILHO`)

      if (temLeak) jsonLeaks++

      if (temTexto && temAgente && temDone && semErro && !temLeak) {
        console.log(`  ✅ OK — agente: ${result.agente}, ${result.fullText.length} chars, ${result.done?.tempo_ms}ms`)
        passouFilho++
      } else {
        console.log(`  ❌ FALHOU — texto:${temTexto} agente:${temAgente} done:${temDone} erro:${!semErro} leak:${temLeak}`)
        if (result.error) console.log(`     Erro: ${JSON.stringify(result.error)}`)
        if (!temTexto) console.log(`     Texto vazio ou muito curto: "${result.fullText}"`)
        falhouFilho++
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ❌ EXCEPTION: ${msg}`)
      falhouFilho++
    }

    // Pausa entre testes para não sobrecarregar
    await sleep(2000)
  }

  // ── MODO PAI: 8 heróis ──
  console.log('\n═══════════════════════════════════════════')
  console.log('  MODO PAI — Testando 8 heróis')
  console.log('═══════════════════════════════════════════\n')

  // Re-autenticar como pai
  if (responsavelId) {
    await client.selectProfile(responsavelId, 'pai', PIN)
    console.log(`  ✅ Perfil pai selecionado\n`)
  } else {
    console.log('  ⚠️ Sem responsável — testando MODO PAI via tipo_usuario\n')
  }

  for (const heroi of HEROIS) {
    console.log(`🦸 ${heroi.nome} (pai): "${heroi.mensagem_pai}"`)

    try {
      const result = await client.sendMessage(
        filhoTeste.id,
        heroi.mensagem_pai,
        { tipo_usuario: 'pai' }
      )

      const temTexto = result.fullText.length > 10
      const temAgente = result.agente !== null
      const temDone = result.done !== null
      const semErro = result.error === null
      const temLeak = checkJSONLeak(result.fullText, `${heroi.nome} PAI`)

      if (temLeak) jsonLeaks++

      if (temTexto && temAgente && temDone && semErro && !temLeak) {
        console.log(`  ✅ OK — agente: ${result.agente}, ${result.fullText.length} chars, ${result.done?.tempo_ms}ms`)
        passouPai++
      } else {
        console.log(`  ❌ FALHOU — texto:${temTexto} agente:${temAgente} done:${temDone} erro:${!semErro} leak:${temLeak}`)
        if (result.error) console.log(`     Erro: ${JSON.stringify(result.error)}`)
        if (!temTexto) console.log(`     Texto vazio ou muito curto: "${result.fullText}"`)
        falhouPai++
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ❌ EXCEPTION: ${msg}`)
      falhouPai++
    }

    await sleep(2000)
  }

  // ── Resumo ──
  const totalPassou = passouFilho + passouPai
  const totalFalhou = falhouFilho + falhouPai
  const total = totalPassou + totalFalhou

  console.log('\n═══════════════════════════════════════════')
  console.log('  RESULTADO GATE BLOCO H')
  console.log('═══════════════════════════════════════════')
  console.log(`  MODO FILHO: ${passouFilho}/8 ✅  ${falhouFilho}/8 ❌`)
  console.log(`  MODO PAI:   ${passouPai}/8 ✅  ${falhouPai}/8 ❌`)
  console.log(`  TOTAL:      ${totalPassou}/${total}`)
  console.log(`  JSON LEAKS: ${jsonLeaks} ${jsonLeaks === 0 ? '✅ ZERO LEAKS!' : '❌ LEAKS DETECTADOS!'}`)
  console.log('═══════════════════════════════════════════\n')

  if (totalFalhou > 0 || jsonLeaks > 0) {
    console.log('❌ GATE BLOCO H FAILED\n')
    process.exit(1)
  } else {
    console.log('✅ GATE BLOCO H PASSED — Todos os disjuntores funcionando!\n')
  }
}

rodarTestes().catch(err => {
  console.error('\n💥 ERRO FATAL:', err.message)
  process.exit(1)
})
