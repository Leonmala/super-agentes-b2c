// Endpoint SSE para processamento de mensagens — migrate from teste6
import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

import { chamarLLM, chamarLLMStream, RespostaLLM } from '../core/llm.js'
import {
  decidirPersona,
  determinarStatus,
  detectarTema,
  classificarTemaInteligente,
  detectarContinuidade
} from '../core/router.js'
import { montarContexto } from '../core/context.js'
import {
  buscarOuCriarSessao,
  buscarAluno,
  buscarUltimosTurnos,
  persistirTurno,
  atualizarSessao
} from '../db/persistence.js'
import { incrementarUso, verificarLimiteAtingido } from '../db/usage-queries.js'
import { MetricasChamada, calcularMetricasRequest, logMetricas } from '../core/metrics.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super-agentes-dev-secret'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cache de personas em memória
const cachePersonas: Map<string, string> = new Map()

function carregarPersona(nome: string): string {
  if (cachePersonas.has(nome)) {
    return cachePersonas.get(nome)!
  }

  try {
    const caminho = path.join(__dirname, '../personas', `${nome}.md`)
    const conteudo = readFileSync(caminho, 'utf-8')
    cachePersonas.set(nome, conteudo)
    return conteudo
  } catch (erro) {
    console.error(`Persona ${nome} não encontrada`)
    throw new Error(`Persona ${nome} não encontrada`)
  }
}

// 8 herois validados
const HEROIS_VALIDOS = [
  'CALCULUS',
  'VERBETTA',
  'NEURON',
  'TEMPUS',
  'GAIA',
  'VECTOR',
  'ALKA',
  'FLEX'
]

// Agentes acessíveis via agente_override (heróis + SUPERVISOR para pais)
const AGENTES_OVERRIDE_VALIDOS = [...HEROIS_VALIDOS, 'SUPERVISOR_EDUCACIONAL']

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/message — SSE endpoint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/message', async (req: Request, res: Response) => {
  const inicio = Date.now()
  const { aluno_id, mensagem, tipo_usuario, agente_override } = req.body

  // Validação básica de payload
  if (!aluno_id || typeof aluno_id !== 'string' || aluno_id.trim() === '') {
    return res.status(400).json({ erro: 'aluno_id é obrigatório e deve ser uma string' })
  }
  if (!mensagem || typeof mensagem !== 'string' || mensagem.trim() === '') {
    return res.status(400).json({ erro: 'mensagem é obrigatória e deve ser uma string' })
  }

  // Extrair JWT
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }

  const token = authHeader.substring(7)
  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }

  const familia_id = decoded.familia_id as string

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const enviarEvento = (evento: string, dados: unknown) => {
    res.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`)
  }

  try {
    // Validar aluno pertence à família
    const aluno = await buscarAluno(aluno_id)
    if (aluno.familia_id !== familia_id) {
      throw new Error('Aluno não pertence à sua família')
    }

    // Buscar sessão
    const tipoUsuario = (tipo_usuario as 'filho' | 'pai') || 'filho'
    const sessao = await buscarOuCriarSessao(aluno_id, tipoUsuario)

    // Verificar limite ANTES de processar
    const limiteInfo = await verificarLimiteAtingido(aluno_id)
    if (limiteInfo.atingido) {
      console.log(`[${aluno_id}] Limite atingido`)
      enviarEvento('limite', {
        mensagem: limiteInfo.mensagem || 'Limite diário atingido'
      })
      res.end()
      return
    }

    // Buscar turnos em paralelo
    // Buscar últimos 10 turnos para contexto + roteamento (3 para contexto LLM, 10 para decidirPersona)
    const ultimosTurnosPromise = buscarUltimosTurnos(sessao.id, 10)

    console.log(`[${aluno_id}] Sessão: ${sessao.id}, Turno: ${sessao.turno_atual}, Agente: ${sessao.agente_atual}`)

    // Router inteligente
    const ultimosTurnos = await ultimosTurnosPromise
    let persona = decidirPersona(mensagem, sessao, ultimosTurnos)
    let temaDetectado = detectarTema(mensagem)

    // Se agente_override fornecido (para SUPERVISOR_EDUCACIONAL, PROFESSOR_IA, ou herói direto)
    if (agente_override) {
      if (!AGENTES_OVERRIDE_VALIDOS.includes(agente_override)) {
        enviarEvento('error', { erro: 'Agente inválido' })
        res.end()
        return
      }
      // SUPERVISOR exclusivo para pais
      if (agente_override === 'SUPERVISOR_EDUCACIONAL' && tipoUsuario !== 'pai') {
        enviarEvento('error', { erro: 'Supervisor disponível apenas para responsáveis' })
        res.end()
        return
      }
      persona = agente_override
      console.log(`[${aluno_id}] Usando agente_override: ${agente_override}`)
    }

    // Tentar classificador inteligente se PSICO inconclusivo
    if (persona === 'PSICOPEDAGOGICO' && !temaDetectado) {
      console.log(`[${aluno_id}] Router inconclusivo. Tentando classificador inteligente...`)
      const classificacao = await classificarTemaInteligente(mensagem)
      console.log(`[${aluno_id}] Classificação: ${classificacao.categoria} (${classificacao.confianca}%)`)

      if (classificacao.confianca >= 70) {
        const heroi = [
          'matematica', 'portugues', 'ciencias', 'historia',
          'geografia', 'fisica', 'quimica', 'ingles', 'espanhol'
        ].includes(classificacao.categoria)
          ? classificationToPersona(classificacao.categoria)
          : null

        if (heroi && HEROIS_VALIDOS.includes(heroi)) {
          persona = heroi
          temaDetectado = classificacao.categoria
          console.log(`[${aluno_id}] Router inteligente: direto para ${heroi}`)
        }
      }
    }

    // Fallback: detectar continuidade por keywords
    if (persona === 'PSICOPEDAGOGICO' && detectarContinuidade(mensagem) && sessao.agente_atual !== 'PSICOPEDAGOGICO') {
      persona = sessao.agente_atual
      console.log(`[${aluno_id}] Continuidade detectada: mantendo ${persona}`)
    }

    console.log(`[${aluno_id}] Persona selecionada: ${persona}`)

    // Carregar system prompt e contexto (usar apenas 3 turnos mais recentes no contexto LLM)
    const systemPrompt = carregarPersona(persona)
    const turnosParaContexto = ultimosTurnos.slice(0, 3)
    const contexto = montarContexto(sessao, aluno, turnosParaContexto, tipoUsuario)

    const chamadasMetricas: MetricasChamada[] = []
    let houveCascata = false
    let agenteFinal: string = persona
    let respostaFinal: string = ''
    let plano: string | null = null

    // ─── Fluxo de decisão ──────────────────────────────────────────────────
    // CASO A: Persona é PSICOPEDAGOGICO
    // CASO B: Herói direto (continuidade)
    // ──────────────────────────────────────────────────────────────────────

    if (persona === 'PSICOPEDAGOGICO') {
      // CASO A: PSICO primeiro (sem stream)
      console.log(`[${aluno_id}] Chamando PSICOPEDAGOGICO...`)
      const respostaLLM: RespostaLLM = await chamarLLM(
        systemPrompt,
        contexto,
        mensagem.trim(),
        persona
      )

      chamadasMetricas.push({
        persona,
        tempo_ms: respostaLLM.tempo_ms,
        tokens_input: respostaLLM.tokens_input,
        tokens_output: respostaLLM.tokens_output,
        tokens_total: respostaLLM.tokens_total,
        modelo: respostaLLM.modelo
      })

      const respostaJSON = respostaLLM.jsonData

      if (respostaJSON?.acao === 'ENCAMINHAR_PARA_HEROI') {
        const heroiEscolhido = respostaJSON.heroi_escolhido

        if (heroiEscolhido && HEROIS_VALIDOS.includes(heroiEscolhido)) {
          console.log(`[${aluno_id}] PSICO gerou plano. Chamando ${heroiEscolhido} em stream...`)
          houveCascata = true
          agenteFinal = heroiEscolhido

          // Extrair plano
          if (respostaJSON.plano_atendimento) {
            plano = JSON.stringify(respostaJSON.plano_atendimento, null, 2)
          }
          const instrucoesHeroi = respostaJSON.instrucoes_para_heroi || ''

          // Montar contexto rico para o herói
          let contextoHeroi = montarContexto(sessao, aluno, ultimosTurnos, tipoUsuario)
          contextoHeroi += `\n\n═══════════════════════════════════════════════════════════════\n`
          contextoHeroi += `PLANO DE ATENDIMENTO GERADO PELO PSICOPEDAGOGICO:\n`
          contextoHeroi += `═══════════════════════════════════════════════════════════════\n`
          contextoHeroi += `Plano: ${plano || 'Não especificado'}\n\n`
          contextoHeroi += `Instruções para você (${heroiEscolhido}):\n${instrucoesHeroi}\n`
          contextoHeroi += `═══════════════════════════════════════════════════════════════\n`
          contextoHeroi += `IMPORTANTE: Responda ao aluno AGORA, já assumindo sua persona. ` +
                           `NÃO mencione o PSICOPEDAGOGICO. Você é ${heroiEscolhido}.\n`

          // Avisar frontend qual herói vai responder
          enviarEvento('agente', { agente: heroiEscolhido })

          // Chamar herói em stream
          const systemPromptHeroi = carregarPersona(heroiEscolhido)
          const metricasHeroi = await chamarLLMStream(
            systemPromptHeroi,
            contextoHeroi,
            mensagem.trim(),
            heroiEscolhido,
            (chunk) => {
              respostaFinal += chunk
              enviarEvento('chunk', { texto: chunk })
            }
          )

          chamadasMetricas.push({
            persona: heroiEscolhido,
            ...metricasHeroi
          })

          console.log(`[${aluno_id}] ${heroiEscolhido} stream concluído`)
        } else {
          // Herói inválido
          agenteFinal = 'PSICOPEDAGOGICO'
          respostaFinal = respostaLLM.textoParaAluno
          enviarEvento('agente', { agente: agenteFinal })
          enviarEvento('chunk', { texto: respostaFinal })
        }
      } else {
        // PSICO respondeu diretamente
        agenteFinal = 'PSICOPEDAGOGICO'
        respostaFinal = respostaLLM.textoParaAluno
        enviarEvento('agente', { agente: agenteFinal })
        enviarEvento('chunk', { texto: respostaFinal })
      }
    } else {
      // CASO B: Herói direto (continuidade)
      console.log(`[${aluno_id}] Chamando ${persona} em stream (continuidade)...`)
      enviarEvento('agente', { agente: persona })

      const metricasHeroi = await chamarLLMStream(
        systemPrompt,
        contexto,
        mensagem.trim(),
        persona,
        (chunk) => {
          respostaFinal += chunk
          enviarEvento('chunk', { texto: chunk })
        }
      )

      chamadasMetricas.push({
        persona,
        ...metricasHeroi
      })
    }

    // ─── Finalizar ─────────────────────────────────────────────────────────
    const status = determinarStatus(mensagem, agenteFinal, sessao)
    const metricas = calcularMetricasRequest(aluno_id, inicio, chamadasMetricas, houveCascata)
    logMetricas(metricas)

    console.log(`[${aluno_id}] Resposta final (${agenteFinal}) em ${metricas.tempo_total_ms}ms`)

    // Enviar evento de conclusão
    enviarEvento('done', {
      agente: agenteFinal,
      turno: sessao.turno_atual + 1,
      tempo_ms: metricas.tempo_total_ms,
      metricas: {
        tempo_total_ms: metricas.tempo_total_ms,
        tokens_total: metricas.tokens_total_request,
        houve_cascata: metricas.houve_cascata,
        chamadas: metricas.chamadas.map(c => ({
          persona: c.persona,
          tempo_ms: c.tempo_ms,
          tokens_input: c.tokens_input,
          tokens_output: c.tokens_output,
          tokens_total: c.tokens_total
        }))
      }
    })

    res.end()

    // ─── Persistir em background e incrementar uso ──────────────────────────
    const novoTurno = sessao.turno_atual + 1

    Promise.all([
      persistirTurno(
        sessao.id,
        novoTurno,
        agenteFinal,
        mensagem.trim(),
        respostaFinal,
        status,
        plano
      ),
      atualizarSessao(sessao.id, {
        turno_atual: novoTurno,
        agente_atual: agenteFinal,
        tema_atual: temaDetectado || sessao.tema_atual,
        plano_ativo: temaDetectado && temaDetectado !== sessao.tema_atual
          ? (plano || null)
          : (plano || sessao.plano_ativo)
      })
    ])
      .then(() => {
        console.log(`[${aluno_id}] Persistência concluída (turno ${novoTurno})`)
        // Incrementar uso após sucesso
        return incrementarUso(aluno_id)
      })
      .then(() => {
        console.log(`[${aluno_id}] Uso incrementado`)
      })
      .catch(erro => {
        console.error(`[${aluno_id}] Erro na persistência/uso:`, erro)
      })
  } catch (erro: any) {
    console.error(`[${aluno_id}] Erro:`, erro.message)

    let mensagemErro = 'Erro interno do servidor'
    if (erro.message?.includes('não encontrado')) {
      mensagemErro = `Aluno não encontrado`
    } else if (erro.message?.includes('não pertence')) {
      mensagemErro = 'Acesso não autorizado'
    } else if (erro.message?.includes('timeout')) {
      mensagemErro = 'O agente demorou demais para responder. Tente novamente.'
    }

    if (!res.headersSent) {
      return res.status(500).json({ erro: mensagemErro })
    }

    enviarEvento('error', { erro: mensagemErro })
    res.end()
  }
})

// Helper: mapeador de categoria para persona
function classificationToPersona(categoria: string): string {
  const mapa: Record<string, string> = {
    'matematica': 'CALCULUS',
    'portugues': 'VERBETTA',
    'ciencias': 'NEURON',
    'historia': 'TEMPUS',
    'geografia': 'GAIA',
    'fisica': 'VECTOR',
    'quimica': 'ALKA',
    'ingles': 'FLEX',
    'espanhol': 'FLEX'
  }
  return mapa[categoria] || 'PSICOPEDAGOGICO'
}

export default router
