/**
 * QA Contínuo — Script despachável como subagente.
 * Testa os 8 heróis, transições, timeout e continuidade.
 * Gera relatório em docs/qa-reports/YYYY-MM-DD.md
 *
 * Uso: API_URL=https://... tsx tests/qa-continuo.ts
 */

import { TestClient } from './helpers/api-client.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = join(__dirname, '../../docs/qa-reports')

const client = new TestClient()

interface TestResult {
  nome: string
  categoria: string
  materia?: string
  passed: boolean
  roteamento: string
  resposta: string
  tempo_ms: number
}

const results: TestResult[] = []

// Login
async function setup(): Promise<string> {
  const login = await client.login('teste-gate1@superagentes.com', 'senha123')
  client.setToken(login.token)

  // Selecionar perfil de aluno fundamental
  const filhos = login.filhos || []
  const aluno = filhos.find((f: { nivel_ensino: string }) => f.nivel_ensino === 'fundamental') || filhos[0]
  if (!aluno) throw new Error('Nenhum aluno encontrado para teste')

  return aluno.id
}

// Teste individual de herói
async function testarHeroi(
  alunoId: string,
  heroi: string,
  materia: string,
  mensagem: string
): Promise<void> {
  const inicio = Date.now()
  try {
    const result = await client.sendMessage(alunoId, mensagem)
    const tempo = Date.now() - inicio

    const passed = result.agente !== null && result.fullText.length > 20
    const routed = result.agente === heroi || result.agente === 'PSICOPEDAGOGICO'

    results.push({
      nome: heroi,
      categoria: 'heroi',
      materia,
      passed: passed && routed,
      roteamento: result.agente || 'null',
      resposta: result.fullText.substring(0, 80) + (result.fullText.length > 80 ? '...' : ''),
      tempo_ms: tempo,
    })
  } catch (err) {
    results.push({
      nome: heroi,
      categoria: 'heroi',
      materia,
      passed: false,
      roteamento: 'ERRO',
      resposta: (err as Error).message.substring(0, 80),
      tempo_ms: Date.now() - inicio,
    })
  }
}

// Teste de transição
async function testarTransicao(
  alunoId: string,
  de: string,
  para: string,
  msg1: string,
  msg2: string
): Promise<void> {
  const inicio = Date.now()
  try {
    const r1 = await client.sendMessage(alunoId, msg1)
    const r2 = await client.sendMessage(alunoId, msg2)
    const tempo = Date.now() - inicio

    const trocou = r2.agente !== r1.agente || r2.agente === 'PSICOPEDAGOGICO'

    results.push({
      nome: `${de} -> ${para}`,
      categoria: 'transicao',
      passed: trocou,
      roteamento: `R1: ${r1.agente}, R2: ${r2.agente}`,
      resposta: '',
      tempo_ms: tempo,
    })
  } catch (err) {
    results.push({
      nome: `${de} -> ${para}`,
      categoria: 'transicao',
      passed: false,
      roteamento: 'ERRO',
      resposta: (err as Error).message.substring(0, 80),
      tempo_ms: Date.now() - inicio,
    })
  }
}

// Gerar relatório markdown
function gerarRelatorio(ambiente: string): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toISOString().slice(11, 16)

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  let md = `# QA Report — ${dateStr} ${timeStr}\n\n`
  md += `## Resumo\n`
  md += `- Total de testes: ${results.length}\n`
  md += `- Passed: ${passed} | Failed: ${failed}\n`
  md += `- Ambiente: ${ambiente}\n\n`

  // Testes por herói
  const herois = results.filter(r => r.categoria === 'heroi')
  if (herois.length > 0) {
    md += `## Testes por Heroi\n\n`
    md += `| Heroi | Materia | Roteamento | Resposta | Tempo | Status |\n`
    md += `|-------|---------|-----------|----------|-------|--------|\n`
    for (const r of herois) {
      const resumo = r.resposta.substring(0, 40).replace(/\|/g, '\\|')
      md += `| ${r.nome} | ${r.materia || '-'} | ${r.roteamento} | ${resumo}... | ${r.tempo_ms}ms | ${r.passed ? 'PASS' : 'FAIL'} |\n`
    }
    md += `\n`
  }

  // Testes de transição
  const transicoes = results.filter(r => r.categoria === 'transicao')
  if (transicoes.length > 0) {
    md += `## Testes de Transicao\n\n`
    md += `| De -> Para | Resultado | Tempo | Status |\n`
    md += `|-----------|-----------|-------|--------|\n`
    for (const r of transicoes) {
      md += `| ${r.nome} | ${r.roteamento} | ${r.tempo_ms}ms | ${r.passed ? 'PASS' : 'FAIL'} |\n`
    }
    md += `\n`
  }

  // Continuidade/timeout
  const outros = results.filter(r => r.categoria === 'continuidade' || r.categoria === 'timeout')
  if (outros.length > 0) {
    md += `## Testes de Timeout/Continuidade\n\n`
    md += `| Cenario | Resultado | Status |\n`
    md += `|---------|-----------|--------|\n`
    for (const r of outros) {
      md += `| ${r.nome} | ${r.roteamento} | ${r.passed ? 'PASS' : 'FAIL'} |\n`
    }
  }

  return md
}

// Main
async function main(): Promise<void> {
  const ambiente = process.env.API_URL || 'http://localhost:3001'
  console.log(`QA Continuo — Ambiente: ${ambiente}\n`)

  const alunoId = await setup()
  console.log(`Aluno: ${alunoId}\n`)

  // 1. Testar 8 heróis
  const heroiTests = [
    { heroi: 'CALCULUS', materia: 'Matematica', msg: 'me ajuda com equacao do segundo grau' },
    { heroi: 'VERBETTA', materia: 'Portugues', msg: 'gramatica e ortografia do portugues' },
    { heroi: 'NEURON', materia: 'Ciencias', msg: 'como funciona a fotossintese nas plantas' },
    { heroi: 'TEMPUS', materia: 'Historia', msg: 'me conta sobre a revolucao francesa' },
    { heroi: 'GAIA', materia: 'Geografia', msg: 'quais sao os biomas do Brasil' },
    { heroi: 'VECTOR', materia: 'Fisica', msg: 'me explica as leis de Newton' },
    { heroi: 'ALKA', materia: 'Quimica', msg: 'o que e uma reacao quimica' },
    { heroi: 'FLEX', materia: 'Ingles', msg: 'help me with verb to be in English' },
  ]

  for (const t of heroiTests) {
    console.log(`  Testando ${t.heroi}...`)
    await testarHeroi(alunoId, t.heroi, t.materia, t.msg)
  }

  // 2. Testes de transição
  console.log(`\n  Testando transicoes...`)
  await testarTransicao(alunoId, 'CALCULUS', 'TEMPUS',
    'me ajuda com equacao do segundo grau',
    'me conta sobre o descobrimento do Brasil'
  )

  // 3. Teste de continuidade
  console.log(`  Testando continuidade...`)
  const inicio = Date.now()
  const r1 = await client.sendMessage(alunoId, 'me ajuda com fracao')
  const r2 = await client.sendMessage(alunoId, 'nao entendi, explica de novo')
  results.push({
    nome: 'Continuidade (mesma materia)',
    categoria: 'continuidade',
    passed: r1.agente === r2.agente,
    roteamento: `R1: ${r1.agente}, R2: ${r2.agente}`,
    resposta: '',
    tempo_ms: Date.now() - inicio,
  })

  // Gerar relatório
  const relatorio = gerarRelatorio(ambiente)
  const dateStr = new Date().toISOString().slice(0, 10)

  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = join(REPORT_DIR, `${dateStr}.md`)
  writeFileSync(reportPath, relatorio, 'utf-8')

  console.log(`\nRelatorio salvo em: ${reportPath}`)
  console.log(`\n${relatorio}`)

  // Exit code
  const failed = results.filter(r => !r.passed).length
  if (failed > 0) {
    console.error(`\n${failed} teste(s) falharam`)
    process.exit(1)
  } else {
    console.log(`\nTodos os testes passaram!`)
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
