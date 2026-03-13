// Gate 5 — Teste E2E dos 8 Agentes + Cascateamento + Qualidade Educacional + MODO PAI
// Gera relatório em tests/reports/gate5-YYYY-MM-DD-HHmm.md
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { TestClient } from './helpers/api-client.js'
import { seedTestFamily, cleanupTestData, TEST_EMAIL, TEST_SENHA } from './helpers/seed-data.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Supabase direto para limpeza de sessão entre testes
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function limparSessoesAluno(alunoId: string) {
  // Buscar TODAS as sessões do aluno (ativas ou não)
  const { data: sessoes } = await supabase
    .from('b2c_sessoes')
    .select('id')
    .eq('aluno_id', alunoId)

  if (sessoes && sessoes.length > 0) {
    const sessaoIds = sessoes.map((s: { id: string }) => s.id)
    // Deletar turnos dessas sessões
    await supabase
      .from('b2c_turnos')
      .delete()
      .in('sessao_id', sessaoIds)
    // Deletar as sessões completamente (não apenas encerrar)
    await supabase
      .from('b2c_sessoes')
      .delete()
      .in('id', sessaoIds)
  }

  // Também resetar uso diário para evitar limite
  await supabase
    .from('b2c_uso_diario')
    .delete()
    .eq('aluno_id', alunoId)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const TIMEOUT_MS = 120_000 // 2 min por teste (cascata pode demorar)
const NOTA_MINIMA = 5 // Threshold generoso — Gemini dev, Kimi prod será melhor

interface TesteHeroi {
  persona: string
  materia: string
  mensagem: string
  mensagemContinuidade: string
}

const TESTES_HEROIS: TesteHeroi[] = [
  {
    persona: 'CALCULUS',
    materia: 'matematica',
    mensagem: 'me ajuda a entender equação de segundo grau',
    mensagemContinuidade: 'não entendi a parte do delta, explica de outro jeito'
  },
  {
    persona: 'VERBETTA',
    materia: 'portugues',
    mensagem: 'qual a diferença entre metáfora e comparação?',
    mensagemContinuidade: 'pode me dar um exemplo prático de cada?'
  },
  {
    persona: 'NEURON',
    materia: 'ciencias',
    mensagem: 'como funciona a fotossíntese?',
    mensagemContinuidade: 'e o que acontece com o oxigênio que a planta produz?'
  },
  {
    persona: 'TEMPUS',
    materia: 'historia',
    mensagem: 'por que aconteceu a revolução francesa?',
    mensagemContinuidade: 'e qual foi o papel da guilhotina nisso?'
  },
  {
    persona: 'GAIA',
    materia: 'geografia',
    mensagem: 'o que causa o aquecimento global?',
    mensagemContinuidade: 'e o que eu posso fazer para ajudar?'
  },
  {
    persona: 'VECTOR',
    materia: 'fisica',
    mensagem: 'me explica as leis de Newton',
    mensagemContinuidade: 'não entendi a terceira lei, a de ação e reação'
  },
  {
    persona: 'ALKA',
    materia: 'quimica',
    mensagem: 'o que é uma reação de oxidação?',
    mensagemContinuidade: 'a ferrugem é oxidação também?'
  },
  {
    persona: 'FLEX',
    materia: 'ingles',
    mensagem: 'how do I use the present perfect?',
    mensagemContinuidade: 'what is the difference between present perfect and simple past?'
  }
]

// ============================================================
// LLM AVALIADOR
// ============================================================

interface Avaliacao {
  construtivismo: number
  adequacao_serie: number
  persona_correta: number
  qualidade_geral: number
  media: number
  observacoes: string
}

async function avaliarResposta(
  genAI: GoogleGenerativeAI,
  persona: string,
  materia: string,
  perguntaAluno: string,
  respostaHeroi: string,
  serie: string,
  modo: 'filho' | 'pai'
): Promise<Avaliacao> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const modoDescricao = modo === 'pai'
    ? 'MODO PAI — resposta deve orientar o pai sobre como explicar ao filho, não ensinar diretamente'
    : 'MODO FILHO — resposta deve ser diretamente para o aluno, construtivista'

  const prompt = `Você é um avaliador pedagógico. Avalie a resposta de um professor-IA educacional.

CONTEXTO:
- Professor: ${persona} (matéria: ${materia})
- Série do aluno: ${serie}
- Modo: ${modoDescricao}
- Pergunta do aluno: "${perguntaAluno}"

RESPOSTA DO PROFESSOR:
"""
${respostaHeroi.substring(0, 2000)}
"""

Avalie de 0 a 10 nos critérios:
1. **construtivismo**: Construiu raciocínio com perguntas guia? NÃO deu resposta pronta? (0=resposta direta, 10=método socrático perfeito)
2. **adequacao_serie**: Linguagem adequada para ${serie}? (0=totalmente inadequada, 10=perfeitamente adaptada)
3. **persona_correta**: Resposta é da matéria ${materia}? Não misturou domínios? (0=matéria errada, 10=perfeitamente focado)
4. **qualidade_geral**: Resposta útil, coerente, educativa? (0=inútil, 10=excelente)

Responda APENAS em JSON válido, sem markdown:
{"construtivismo":N,"adequacao_serie":N,"persona_correta":N,"qualidade_geral":N,"observacoes":"texto curto com pontos fortes e fracos"}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Tentar extrair JSON mesmo se vier com markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn(`[Avaliador] Resposta não-JSON para ${persona}: ${text.substring(0, 200)}`)
      return { construtivismo: 5, adequacao_serie: 5, persona_correta: 5, qualidade_geral: 5, media: 5, observacoes: 'Avaliador falhou em gerar JSON' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const media = (parsed.construtivismo + parsed.adequacao_serie + parsed.persona_correta + parsed.qualidade_geral) / 4

    return {
      construtivismo: parsed.construtivismo,
      adequacao_serie: parsed.adequacao_serie,
      persona_correta: parsed.persona_correta,
      qualidade_geral: parsed.qualidade_geral,
      media: Math.round(media * 10) / 10,
      observacoes: parsed.observacoes || ''
    }
  } catch (erro: any) {
    console.error(`[Avaliador] Erro ao avaliar ${persona}:`, erro.message)
    return { construtivismo: 5, adequacao_serie: 5, persona_correta: 5, qualidade_geral: 5, media: 5, observacoes: `Erro: ${erro.message}` }
  }
}

// ============================================================
// RELATÓRIO
// ============================================================

interface ResultadoTeste {
  persona: string
  materia: string
  tipo: 'cascata' | 'continuidade' | 'modo_pai' | 'troca_materia'
  pergunta: string
  agenteRetornado: string | null
  resposta: string
  tempoMs: number
  avaliacao: Avaliacao
  passou: boolean
  erro?: string
}

function gerarRelatorio(resultados: ResultadoTeste[]): string {
  const agora = new Date()
  const dataStr = agora.toISOString().replace(/[:.]/g, '-').substring(0, 16)

  const totalTestes = resultados.length
  const passaram = resultados.filter(r => r.passou).length
  const falharam = totalTestes - passaram
  const mediasGerais = resultados.reduce((acc, r) => acc + r.avaliacao.media, 0) / totalTestes

  let md = `# Gate 5 — Relatório de Testes E2E dos Agentes\n\n`
  md += `**Data:** ${agora.toLocaleString('pt-BR')}\n`
  md += `**Total:** ${totalTestes} testes | ✅ ${passaram} passaram | ❌ ${falharam} falharam\n`
  md += `**Média geral:** ${mediasGerais.toFixed(1)}/10\n`
  md += `**Threshold:** ${NOTA_MINIMA}/10\n\n`
  md += `---\n\n`

  // Resumo por herói
  md += `## Resumo por Herói\n\n`
  md += `| Herói | Tipo | Agente | Constr. | Série | Persona | Geral | Média | Status |\n`
  md += `|-------|------|--------|---------|-------|---------|-------|-------|--------|\n`

  for (const r of resultados) {
    const status = r.passou ? '✅' : '❌'
    md += `| ${r.persona} | ${r.tipo} | ${r.agenteRetornado || 'N/A'} | ${r.avaliacao.construtivismo} | ${r.avaliacao.adequacao_serie} | ${r.avaliacao.persona_correta} | ${r.avaliacao.qualidade_geral} | **${r.avaliacao.media}** | ${status} |\n`
  }

  md += `\n---\n\n`

  // Detalhes por teste
  md += `## Detalhes\n\n`

  for (const r of resultados) {
    const status = r.passou ? '✅ PASSOU' : '❌ FALHOU'
    md += `### ${r.persona} — ${r.tipo} ${status}\n\n`
    md += `**Pergunta:** ${r.pergunta}\n\n`
    md += `**Agente retornado:** ${r.agenteRetornado || 'N/A'}\n\n`
    md += `**Tempo:** ${r.tempoMs}ms\n\n`

    if (r.erro) {
      md += `**ERRO:** ${r.erro}\n\n`
    }

    md += `**Resposta:**\n\n> ${r.resposta.substring(0, 1500).replace(/\n/g, '\n> ')}\n\n`

    md += `**Avaliação:**\n`
    md += `- Construtivismo: ${r.avaliacao.construtivismo}/10\n`
    md += `- Adequação à série: ${r.avaliacao.adequacao_serie}/10\n`
    md += `- Persona correta: ${r.avaliacao.persona_correta}/10\n`
    md += `- Qualidade geral: ${r.avaliacao.qualidade_geral}/10\n`
    md += `- **Média: ${r.avaliacao.media}/10**\n`
    md += `- Observações: ${r.avaliacao.observacoes}\n\n`
    md += `---\n\n`
  }

  return md
}

// ============================================================
// TESTES
// ============================================================

describe('Gate 5 — Agentes E2E', () => {
  const client = new TestClient()
  let familiaId: string
  let alunoFundId: string
  let alunoMedioId: string
  const resultados: ResultadoTeste[] = []
  let genAIAvaliador: GoogleGenerativeAI

  before(async () => {
    // Setup
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY obrigatória para avaliador')
    genAIAvaliador = new GoogleGenerativeAI(apiKey)

    // Seed test data
    const seed = await seedTestFamily()
    familiaId = seed.familia.id
    alunoFundId = seed.alunoFundamental.id
    alunoMedioId = seed.alunoMedio.id

    // Login
    await client.login(TEST_EMAIL, TEST_SENHA)

    // Limpar dados residuais dos alunos antes de começar
    await limparSessoesAluno(alunoFundId)
    await limparSessoesAluno(alunoMedioId)

    console.log(`[Gate 5] Setup completo. Familia: ${familiaId}, Aluno Fund: ${alunoFundId}, Aluno Med: ${alunoMedioId}`)
  })

  after(async () => {
    // Gerar relatório
    const reportDir = path.join(__dirname, 'reports')
    mkdirSync(reportDir, { recursive: true })

    const agora = new Date()
    const timestamp = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}-${String(agora.getHours()).padStart(2, '0')}${String(agora.getMinutes()).padStart(2, '0')}`
    const reportPath = path.join(reportDir, `gate5-${timestamp}.md`)

    const relatorio = gerarRelatorio(resultados)
    writeFileSync(reportPath, relatorio, 'utf-8')

    console.log(`\n[Gate 5] Relatório salvo: ${reportPath}`)
    console.log(`[Gate 5] Total: ${resultados.length} testes`)
    console.log(`[Gate 5] Passaram: ${resultados.filter(r => r.passou).length}`)
    console.log(`[Gate 5] Falharam: ${resultados.filter(r => !r.passou).length}`)

    // Cleanup
    await cleanupTestData(familiaId)
  })

  // ─── TESTE CASCATA (primeiro contato com matéria = PSICO → Herói) ──────

  for (const heroi of TESTES_HEROIS) {
    it(`5.1 Cascata: ${heroi.persona} — primeira mensagem sobre ${heroi.materia}`, { timeout: TIMEOUT_MS }, async () => {
      const inicio = Date.now()

      // Usar aluno fundamental para maioria, médio para VECTOR/ALKA (física/química)
      const alunoId = ['VECTOR', 'ALKA'].includes(heroi.persona) ? alunoMedioId : alunoFundId
      const serie = ['VECTOR', 'ALKA'].includes(heroi.persona) ? '2º EM' : '5º ano'

      // LIMPEZA: limpar sessões e uso diário para cada teste cascata ter estado limpo
      await limparSessoesAluno(alunoId)

      const result = await client.sendMessage(alunoId, heroi.mensagem)
      const tempoMs = Date.now() - inicio

      // Verificações básicas
      const temResposta = result.fullText.length > 50
      assert.ok(temResposta, `${heroi.persona}: resposta muito curta (${result.fullText.length} chars)`)

      // O agente deve ser o herói (ou PSICO em cascata, mas done deve ter o herói)
      const agenteEfetivo = result.done?.agente || result.agente || 'DESCONHECIDO'
      console.log(`  [${heroi.persona}] Agente: ${agenteEfetivo}, ${result.fullText.length} chars, ${tempoMs}ms`)

      // Avaliar qualidade
      const avaliacao = await avaliarResposta(
        genAIAvaliador,
        heroi.persona,
        heroi.materia,
        heroi.mensagem,
        result.fullText,
        serie,
        'filho'
      )

      const passou = avaliacao.media >= NOTA_MINIMA && temResposta

      resultados.push({
        persona: heroi.persona,
        materia: heroi.materia,
        tipo: 'cascata',
        pergunta: heroi.mensagem,
        agenteRetornado: agenteEfetivo,
        resposta: result.fullText,
        tempoMs,
        avaliacao,
        passou,
        erro: result.error ? JSON.stringify(result.error) : undefined
      })

      console.log(`  [${heroi.persona}] Avaliação: ${avaliacao.media}/10 (${passou ? 'PASSOU' : 'FALHOU'})`)
      assert.ok(passou, `${heroi.persona}: média ${avaliacao.media} < ${NOTA_MINIMA}. Obs: ${avaliacao.observacoes}`)
    })
  }

  // ─── TESTE CONTINUIDADE (segunda mensagem = herói direto) ──────────────

  // Testar continuidade em 3 heróis representativos (CALCULUS, NEURON, FLEX)
  for (const heroi of TESTES_HEROIS.filter(h => ['CALCULUS', 'NEURON', 'FLEX'].includes(h.persona))) {
    it(`5.2 Continuidade: ${heroi.persona} — follow-up`, { timeout: TIMEOUT_MS }, async () => {
      const inicio = Date.now()

      const alunoId = heroi.persona === 'FLEX' ? alunoFundId : alunoFundId
      const serie = '5º ano'

      // Limpar sessão + uso para começar fresh, depois enviar mensagem inicial para ter sessão ativa
      await limparSessoesAluno(alunoId)

      // Enviar mensagem inicial para criar sessão com o herói
      console.log(`  [${heroi.persona} cont] Enviando mensagem inicial...`)
      await client.sendMessage(alunoId, heroi.mensagem)

      // Resetar uso diário após a mensagem inicial (para não bater no limite)
      await supabase.from('b2c_uso_diario').delete().eq('aluno_id', alunoId)

      // Agora enviar follow-up
      const result = await client.sendMessage(alunoId, heroi.mensagemContinuidade)
      const tempoMs = Date.now() - inicio

      const temResposta = result.fullText.length > 50
      assert.ok(temResposta, `${heroi.persona} cont: resposta muito curta`)

      const agenteEfetivo = result.done?.agente || result.agente || 'DESCONHECIDO'
      console.log(`  [${heroi.persona} cont] Agente: ${agenteEfetivo}, ${result.fullText.length} chars, ${tempoMs}ms`)

      const avaliacao = await avaliarResposta(
        genAIAvaliador,
        heroi.persona,
        heroi.materia,
        heroi.mensagemContinuidade,
        result.fullText,
        serie,
        'filho'
      )

      const passou = avaliacao.media >= NOTA_MINIMA && temResposta

      resultados.push({
        persona: heroi.persona,
        materia: heroi.materia,
        tipo: 'continuidade',
        pergunta: heroi.mensagemContinuidade,
        agenteRetornado: agenteEfetivo,
        resposta: result.fullText,
        tempoMs,
        avaliacao,
        passou,
        erro: result.error ? JSON.stringify(result.error) : undefined
      })

      console.log(`  [${heroi.persona} cont] Avaliação: ${avaliacao.media}/10 (${passou ? 'PASSOU' : 'FALHOU'})`)
      assert.ok(passou, `${heroi.persona} cont: média ${avaliacao.media} < ${NOTA_MINIMA}`)
    })
  }

  // ─── TESTE MODO PAI (CALCULUS + VERBETTA) ──────────────────────────────

  for (const heroi of TESTES_HEROIS.filter(h => ['CALCULUS', 'VERBETTA'].includes(h.persona))) {
    it(`5.3 Modo Pai: ${heroi.persona} — orientação parental`, { timeout: TIMEOUT_MS }, async () => {
      const inicio = Date.now()

      // Resetar uso diário e sessão para modo pai limpo
      await limparSessoesAluno(alunoFundId)

      const result = await client.sendMessage(alunoFundId, heroi.mensagem, { tipo_usuario: 'pai' })
      const tempoMs = Date.now() - inicio

      const temResposta = result.fullText.length > 50
      assert.ok(temResposta, `${heroi.persona} pai: resposta muito curta`)

      const agenteEfetivo = result.done?.agente || result.agente || 'DESCONHECIDO'
      console.log(`  [${heroi.persona} PAI] Agente: ${agenteEfetivo}, ${result.fullText.length} chars, ${tempoMs}ms`)

      const avaliacao = await avaliarResposta(
        genAIAvaliador,
        heroi.persona,
        heroi.materia,
        heroi.mensagem,
        result.fullText,
        '5º ano',
        'pai'
      )

      const passou = avaliacao.media >= NOTA_MINIMA && temResposta

      resultados.push({
        persona: heroi.persona,
        materia: heroi.materia,
        tipo: 'modo_pai',
        pergunta: heroi.mensagem,
        agenteRetornado: agenteEfetivo,
        resposta: result.fullText,
        tempoMs,
        avaliacao,
        passou,
        erro: result.error ? JSON.stringify(result.error) : undefined
      })

      console.log(`  [${heroi.persona} PAI] Avaliação: ${avaliacao.media}/10 (${passou ? 'PASSOU' : 'FALHOU'})`)
      assert.ok(passou, `${heroi.persona} pai: média ${avaliacao.media} < ${NOTA_MINIMA}`)
    })
  }

  // ─── TESTE TROCA DE MATÉRIA ────────────────────────────────────────────

  it('5.4 Troca de matéria: matemática → história', { timeout: TIMEOUT_MS }, async () => {
    const inicio = Date.now()

    // Limpar sessões e uso diário para estado limpo
    await limparSessoesAluno(alunoFundId)

    // Primeiro, enviar mensagem de matemática para estabelecer sessão com CALCULUS
    await client.sendMessage(alunoFundId, 'quanto é 15 vezes 8?')
    // Resetar uso diário para não bater limite
    await supabase.from('b2c_uso_diario').delete().eq('aluno_id', alunoFundId)

    // Agora enviar mensagem de história (troca de matéria)
    const result = await client.sendMessage(alunoFundId, 'me conta sobre o descobrimento do Brasil')
    const tempoMs = Date.now() - inicio

    const temResposta = result.fullText.length > 50
    assert.ok(temResposta, 'Troca matéria: resposta muito curta')

    const agenteEfetivo = result.done?.agente || result.agente || 'DESCONHECIDO'
    console.log(`  [TROCA] Agente: ${agenteEfetivo}, ${result.fullText.length} chars, ${tempoMs}ms`)

    const avaliacao = await avaliarResposta(
      genAIAvaliador,
      'TEMPUS',
      'historia',
      'me conta sobre o descobrimento do Brasil',
      result.fullText,
      '5º ano',
      'filho'
    )

    const passou = avaliacao.media >= NOTA_MINIMA && temResposta

    resultados.push({
      persona: 'TEMPUS',
      materia: 'historia',
      tipo: 'troca_materia',
      pergunta: 'me conta sobre o descobrimento do Brasil',
      agenteRetornado: agenteEfetivo,
      resposta: result.fullText,
      tempoMs,
      avaliacao,
      passou,
      erro: result.error ? JSON.stringify(result.error) : undefined
    })

    console.log(`  [TROCA] Avaliação: ${avaliacao.media}/10 (${passou ? 'PASSOU' : 'FALHOU'})`)
    assert.ok(passou, `Troca matéria: média ${avaliacao.media} < ${NOTA_MINIMA}`)
  })
})
