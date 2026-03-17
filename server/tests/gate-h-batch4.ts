import { TestClient } from './helpers/api-client.js'
const API = process.env.API_URL || 'https://independent-eagerness-production-7da9.up.railway.app'
const LEAKS = [/"agent_id"\s*:/, /"reply_text"\s*:/, /"sinal_psicopedagogico"\s*:/, /"acao"\s*:\s*"ENCAMINHAR/, /"heroi_escolhido"\s*:/, /"resposta_para_aluno"\s*:/]
function checkLeak(t: string): boolean { return LEAKS.some(p => p.test(t)) }

async function main() {
  const client = new TestClient(API)
  const login = await client.login('leon@pense-ai.com', '3282')
  const filhoId = login.filhos[0].id
  if (login.responsavel?.id) await client.selectProfile(login.responsavel.id, 'pai', '3282')

  console.log('\n─── FLEX (pai) ───')
  console.log('📝 "como ajudar meu filho com inglês básico"')
  const r = await client.sendMessage(filhoId, 'como ajudar meu filho com inglês básico', { tipo_usuario: 'pai' })
  if (r.fullText.length === 0) { console.log('⚠️  LIMITE ou VAZIO'); return }
  const leak = checkLeak(r.fullText)
  console.log(`🤖 Agente: ${r.agente} | ⏱️ ${r.done?.tempo_ms}ms | ${r.fullText.length} chars`)
  console.log('┌──────────────────────────────────────────')
  console.log(r.fullText.split('\n').map((l: string) => `│ ${l}`).join('\n'))
  console.log('└──────────────────────────────────────────')
  console.log(leak ? '🚨 JSON LEAK DETECTADO!' : '✅ OK — zero leaks')
}
main().catch(e => console.error('ERRO:', e.message))
