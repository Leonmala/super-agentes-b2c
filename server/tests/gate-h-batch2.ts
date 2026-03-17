// Batch 2: VECTOR, ALKA, FLEX (filho) + CALCULUS, VERBETTA (pai)
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

  // MODO FILHO: 3 restantes
  await client.selectProfile(filhoId, 'filho')
  await test(client, filhoId, 'VECTOR', 'o que é velocidade e aceleração', 'filho'); await sleep(1500)
  await test(client, filhoId, 'ALKA', 'o que é uma reação química', 'filho'); await sleep(1500)
  await test(client, filhoId, 'FLEX', 'how do I say bom dia in english', 'filho'); await sleep(1500)

  // MODO PAI: primeiros 2
  if (respId) await client.selectProfile(respId, 'pai', '3282')
  await test(client, filhoId, 'CALCULUS', 'como ensinar frações pro meu filho', 'pai'); await sleep(1500)
  await test(client, filhoId, 'VERBETTA', 'como ajudar meu filho com crase', 'pai')
}

main().catch(e => console.error('ERRO:', e.message))
