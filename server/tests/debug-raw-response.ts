// Debug: ver o que o servidor retorna raw para uma mensagem
import { TestClient } from './helpers/api-client.js'

const API_URL = process.env.API_URL || 'https://independent-eagerness-production-7da9.up.railway.app'

async function main() {
  const client = new TestClient(API_URL)
  const login = await client.login('leon@pense-ai.com', '3282')

  console.log('Login OK, token obtido')
  console.log('Filhos:', login.filhos.map(f => `${f.nome} (${f.id})`))

  // Testar raw response
  const res = await fetch(API_URL + '/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + login.token
    },
    body: JSON.stringify({
      aluno_id: login.filhos[0].id,
      mensagem: 'o que é velocidade',
      tipo_usuario: 'filho'
    })
  })

  console.log('\nStatus:', res.status)
  console.log('Content-Type:', res.headers.get('content-type'))
  const text = await res.text()
  console.log('Body length:', text.length)
  console.log('\n--- BODY COMPLETO ---')
  console.log(text)
  console.log('--- FIM ---')
}

main().catch(e => console.error('ERRO:', e.message))
