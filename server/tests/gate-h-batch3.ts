// Batch 3: NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX (pai)
import { TestClient } from './helpers/api-client.js'

const API = process.env.API_URL || 'https://independent-eagerness-production-7da9.up.railway.app'
const LEAKS = [/"agent_id"\s*:/, /"reply_text"\s*:/, /"sinal_psicopedagogico"\s*:/, /"acao"\s*:\s*"ENCAMINHAR/, /"heroi_escolhido"\s*:/, /"plano_atendimento"\s*:/, /"instrucoes_para_heroi"\s*:/, /"resposta_para_aluno"\s*:/]

function checkLeak(t: string): boolean { return LEAKS.some(p => p.test(t)) }
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

async function test(client: TestClient, filhoId: string, heroi: string, msg: string, modo: 'filho' | 'pai') {
  console.log(`\n─── ${heroi} (${modo}) ───`)
  console.log(`📝 "${msg}"`)
  const r = await client.sendMessage(filhoId, msg, { tipo_usuario: modo })
  if (r.fullText.length === 0) { console.log(`⚠️  LIMITE ou VAZIO`); return }
  const leak = checkLeak(r.fullText)
  console.log(`🤖 Agente: ${r.agente} | ⏱️ ${r.done?.tempo_ms}ms | ${r.fullText.length} chars`)
  console.log(`┌──────────────────────────────────────────`)
  console.log(r.fullText.split('\n').map((l: string) => `│ ${l}`).join('\n'))
  console.log(`└──────────────────────────────────────────`)
  console.log(leak ? '🚨 JSON LEAK DETECTADO!' : '✅ OK — zero leaks')
}

async function main() {
  const client = new TestClient(API)
  const login = await client.login('leon@pense-ai.com', '3282')
  const filhoId = login.filhos[0].id
  const respId = login.responsavel?.id

  if (respId) await client.selectProfile(respId, 'pai', '3282')

  await test(client, filhoId, 'NEURON', 'como explicar fotossíntese pro meu filho', 'pai'); await sleep(1500)
  await test(client, filhoId, 'TEMPUS', 'como ensinar história da independência', 'pai'); await sleep(1500)
  await test(client, filhoId, 'GAIA', 'como ensinar biomas brasileiros', 'pai'); await sleep(1500)
  await test(client, filhoId, 'VECTOR', 'como explicar física de velocidade', 'pai'); await sleep(1500)
  await test(client, filhoId, 'ALKA', 'como ensinar reações químicas', 'pai'); await sleep(1500)
  await test(client, filhoId, 'FLEX', 'como ajudar meu filho com inglês básico', 'pai')

  console.log('\n✅ Batch 3 completo')
}

main().catch(e => console.error('ERRO:', e.message))
