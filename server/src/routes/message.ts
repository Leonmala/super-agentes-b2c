// Endpoint SSE para processamento de mensagens — migrate from teste6
import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

import { chamarLLM, chamarLLMStream, RespostaLLM, ResultadoStream } from '../core/llm.js'
import type { SinaisPedagogicos } from '../core/response-processor.js'
import {
  decidirPersona,
  determinarStatus,
  detectarTema,
  detectarContinuidade,
  personaPorTema
} from '../core/router.js'
import { montarContexto } from '../core/context.js'
import {
  buscarOuCriarSessao,
  buscarAluno,
  buscarUltimosTurnos,
  persistirTurno,
  atualizarSessao,
  atualizarUltimoTurno,
  resetarSessaoAgente,
  buscarFilhosDaFamilia,
  buscarTurnosDaFilha,
  buscarOuCriarSessaoSupervisor,
  salvarTurnoSupervisor,
  buscarUltimaInteracaoFilha,
  buscarNomeResponsavel,
  buscarKnowledgeBase,
  buscarConsultaResultado,
  limparConsultaResultado,
  persistirKnowledgeBase,
  persistirConsultaResultado,
} from '../db/persistence.js'
import {
  obterOuGerarAcervo,
  formatarKnowledgeBase,
  processarConsulta,
  processarQuiz,
  investigarLink,
} from '../super-prova/index.js'
import { detectarURL } from '../utils/detect-url.js'
import { incrementarUso, verificarLimiteAtingido, incrementarTurnoCompleto } from '../db/usage-queries.js'
import { buscarContextoProfessorIA, buscarContextoLongoPrazo } from '../db/qdrant.js'
import { MetricasChamada, calcularMetricasRequest, logMetricas } from '../core/metrics.js'
import { registrarDispositivo, verificarLimiteDispositivos } from '../core/dispositivos.js'

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
const AGENTES_OVERRIDE_VALIDOS = [...HEROIS_VALIDOS, 'SUPERVISOR_EDUCACIONAL', 'PROFESSOR_IA']

// Mapa herói → matéria para Super Prova
const HEROI_MATERIA_MAP: Record<string, string> = {
  CALCULUS: 'matematica',
  VERBETTA: 'portugues',
  NEURON:   'ciencias_biologia',
  TEMPUS:   'historia',
  GAIA:     'geografia',
  VECTOR:   'fisica',
  ALKA:     'quimica',
  FLEX:     'idiomas',
}
function heroiParaMateria(heroiId: string): string {
  return HEROI_MATERIA_MAP[heroiId] ?? 'geral'
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/message — SSE endpoint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/message', async (req: Request, res: Response) => {
  const inicio = Date.now()
  const { aluno_id, mensagem: mensagemRaw, tipo_usuario, agente_override, nova_sessao, imagem_base64 } = req.body
  // Strip defensivo do prefixo data: (o frontend já faz isso, mas por segurança)
  const rawBase64 = typeof imagem_base64 === 'string' && imagem_base64.length > 0
    ? imagem_base64.replace(/^data:[^;]+;base64,/, '')
    : undefined
  const imagemBase64: string | undefined = rawBase64 && rawBase64.length > 0 ? rawBase64 : undefined
  // mensagem normalizada — string garantida (vazia no máximo), segura para .trim() em todo o handler
  const mensagem: string = typeof mensagemRaw === 'string' ? mensagemRaw : ''

  // Validação básica de payload
  if (!aluno_id || typeof aluno_id !== 'string' || aluno_id.trim() === '') {
    return res.status(400).json({ erro: 'aluno_id é obrigatório e deve ser uma string' })
  }
  // mensagem pode ser vazia quando há imagem (envio só-foto é permitido)
  if (mensagem.trim() === '' && !imagemBase64) {
    return res.status(400).json({ erro: 'mensagem é obrigatória quando não há imagem' })
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

  // Validação de tamanho de imagem: 700KB em base64 ≈ 525KB binário (base64 tem ~33% overhead)
  if (imagemBase64 && imagemBase64.length / 1024 > 700) {
    enviarEvento('error', {
      erro: 'Imagem muito grande',
      codigo: 'IMAGEM_EXCEDE_LIMITE',
      mensagem: `Máximo 500KB. Tente compactar a imagem.`,
    })
    res.end()
    return
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

    // Verificar dispositivo simultâneo
    const deviceToken = req.headers['x-device-token'] as string
    if (deviceToken) {
      const tipoPerfil = (tipo_usuario as string) || 'filho'
      await registrarDispositivo(familia_id, aluno_id, tipoPerfil, deviceToken)
      const deviceCheck = await verificarLimiteDispositivos(familia_id)

      if (!deviceCheck.permitido) {
        enviarEvento('error', {
          erro: 'Limite de dispositivos simultâneos atingido',
          mensagem: `Sua família tem ${deviceCheck.ativos} dispositivos ativos (limite: ${deviceCheck.limite}). Feche a sessão em outro dispositivo.`
        })
        res.end()
        return
      }
    }

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

    // Router inteligente (async — inclui timeout + classificador LLM)
    const ultimosTurnos = await ultimosTurnosPromise

    // Resetar sessão no banco se nova_sessao flag
    if (nova_sessao === true) {
      await resetarSessaoAgente(sessao.id)
    }

    // ── HOOK 0 — LINK GUARDIAN ────────────────────────────────────────────────────
    let linkKbSalvaNesteTurno = false  // flag: impede Hook 1 de sobrescrever KB do link
    const LINK_GUARDIAN_ATIVO = true   // ← ativado após correção completa
    if (LINK_GUARDIAN_ATIVO) {
      const linkDetectado = detectarURL(mensagem)
      const linkParaInvestigar = linkDetectado?.url ?? sessao.link_pendente ?? null
      const temContextoLink    = linkDetectado?.temContexto || !!sessao.link_pendente

      if (linkParaInvestigar && !temContextoLink) {
        // Branch A: link sem contexto → PSICO pede explicação, salva link_pendente, encerra
        const nomeAluno = aluno.nome?.split(' ')[0] ?? ''
        await atualizarSessao(sessao.id, { link_pendente: linkParaInvestigar })
        const textoResposta = `Oi, ${nomeAluno}! Antes de eu abrir esse link, me conta: do que ele trata e o que a gente vai estudar com ele?`
        enviarEvento('agente', { agente: 'PSICOPEDAGOGICO' })
        enviarEvento('chunk', { texto: textoResposta })
        enviarEvento('done', {})
        // Persistir interação no banco (turno PAUSA — aguardando contexto do link)
        persistirTurno(
          sessao.id,
          sessao.turno_atual + 1,
          'PSICOPEDAGOGICO',
          mensagem,
          textoResposta,
          'PAUSA',
          null
        ).catch(() => {})
        res.end()
        return
      }

      if (linkParaInvestigar && temContextoLink) {
        // Branch B: link + contexto (ou link_pendente + contexto novo) → Super Prova investiga
        enviarEvento('search', { texto: '🔍 analisando conteúdo do link...' })
        const kbLink = await investigarLink(
          linkParaInvestigar,
          mensagem,
          aluno.serie ?? '7ano',
          sessao.agente_atual ?? 'GAIA'
        ).catch(() => null)
        if (kbLink) {
          await persistirKnowledgeBase(sessao.id, kbLink).catch(() => {})
          linkKbSalvaNesteTurno = true  // protege KB: Hook 1 não pode sobrescrever
        } else {
          // F1: fallback quando fetch/Gemini falham — instrui herói a pedir o trecho ao aluno
          const kbFallback = `LINK_GUARDIAN: o aluno enviou o link ${linkParaInvestigar} mas o conteúdo não pôde ser acessado automaticamente (site bloqueado, conteúdo dinâmico ou link inválido).\nINTENÇÃO DO ALUNO: "${mensagem}"\nINSTRUÇÃO PARA O HERÓI: Informe o aluno de forma natural que não conseguiu abrir o link diretamente, e peça que cole no chat o trecho ou parágrafo principal do conteúdo que quer estudar.`
          await persistirKnowledgeBase(sessao.id, kbFallback).catch(() => {})
          linkKbSalvaNesteTurno = true  // protege KB: Hook 1 não pode sobrescrever
        }
        await atualizarSessao(sessao.id, { link_pendente: null })
        // ← continua para decidirPersona(), mas agente_override será ignorado (forçará PSICO cascade)
      }
    }
    // ── FIM HOOK 0 ────────────────────────────────────────────────────────────

    let { persona, temaDetectado } = await decidirPersona(
      mensagem, sessao, ultimosTurnos, nova_sessao === true
    )

    // Chunk 5 — Branch B: link KB salva + sem plano ativo → forçar PSICO cascade para criar plano
    if (linkKbSalvaNesteTurno && !sessao.plano_ativo) {
      persona = 'PSICOPEDAGOGICO'
      console.log(`[${aluno_id}] Branch B: KB de link + sem plano → PSICO cascade`)
    }

    // Se agente_override fornecido (para SUPERVISOR_EDUCACIONAL, PROFESSOR_IA, ou herói direto)
    // Ignorar quando KB do link foi salva neste turno — forçar PSICO cascade para montar plano pedagógico
    if (agente_override && !linkKbSalvaNesteTurno) {
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

    // Fallback: detectar continuidade por keywords
    if (persona === 'PSICOPEDAGOGICO' && detectarContinuidade(mensagem) && sessao.agente_atual !== 'PSICOPEDAGOGICO') {
      persona = sessao.agente_atual
      temaDetectado = sessao.tema_atual
      console.log(`[${aluno_id}] Continuidade detectada: mantendo ${persona}`)
    }

    // ─── GUARDIÃO: resposta elegante sem LLM ─────────────────────────────────
    // Ativado quando detectarGuardiao() flagou jailbreak ou conteúdo fora de escopo.
    // Não chama nenhum LLM. Retorna mensagem educacional hardcoded e encerra.
    if (persona === 'GUARDIAO') {
      const nomeAluno = aluno.nome?.split(' ')[0] || ''
      const saudacao = nomeAluno ? `${nomeAluno}, ` : ''
      const msgGuardiao = `Oi, ${saudacao}aqui só consigo te ajudar com matérias escolares! 😊 Matemática, Português, Ciências, História, Geografia, Física, Química, Inglês ou Espanhol — qual você quer explorar hoje?`
      enviarEvento('agente', { agente: 'PSICOPEDAGOGICO' })
      enviarEvento('chunk', { texto: msgGuardiao })
      enviarEvento('done', {})
      res.end()
      return
    }
    // ─────────────────────────────────────────────────────────────────────────

    console.log(`[${aluno_id}] Persona selecionada: ${persona}`)

    // Carregar system prompt e contexto (usar apenas 3 turnos mais recentes no contexto LLM)
    const systemPrompt = carregarPersona(persona)
    const turnosParaContexto = ultimosTurnos.slice(0, 3)
    const contexto = montarContexto(sessao, aluno, turnosParaContexto, tipoUsuario)

    const chamadasMetricas: MetricasChamada[] = []
    let houveCascata = false
    let agenteFinal: string = persona
    let quizSsePromise: Promise<void> | null = null  // Hook 3: QUIZ precisa ser aguardado antes de res.end()
    let respostaFinal: string = ''
    let plano: string | null = null
    let sinaisHeroi: SinaisPedagogicos | null = null

    // ─── Fluxo de decisão ──────────────────────────────────────────────────
    // CASO A: Persona é PSICOPEDAGOGICO
    // CASO B: Herói direto (continuidade)
    // ──────────────────────────────────────────────────────────────────────

    if (persona === 'PSICOPEDAGOGICO') {
      // CASO A: PSICO primeiro (sem stream)
      console.log(`[${aluno_id}] Chamando PSICOPEDAGOGICO...`)
      // PSICO VÊ a imagem para identificar o tema e rotear para o herói correto.
      // O texto "[foto anexada]" ajuda o PSICO a verbalizar que recebeu uma imagem.
      // Sem ver a imagem, PSICO pergunta "qual matéria?" mesmo quando a foto já responde.
      const mensagemParaPsico = imagemBase64
        ? `[foto anexada]${mensagem.trim() ? ' ' + mensagem.trim() : ''}`
        : mensagem.trim()

      const respostaLLM: RespostaLLM = await chamarLLM(
        systemPrompt,
        contexto,
        mensagemParaPsico,
        persona,
        imagemBase64  // PSICO vê a imagem → identifica o tema → roteia para o herói certo
      )

      chamadasMetricas.push({
        persona,
        tempo_ms: respostaLLM.tempo_ms,
        tokens_input: respostaLLM.tokens_input,
        tokens_output: respostaLLM.tokens_output,
        tokens_total: respostaLLM.tokens_total,
        modelo: respostaLLM.modelo
      })

      // Bloco H: usar pipeline processado em vez de jsonData raw
      const cascata = respostaLLM.processed.cascata
      const respostaJSON = respostaLLM.processed.jsonOriginal

      // Detectar se PSICO quer encaminhar
      const acaoPsico = cascata?.acao || ''
      const querEncaminhar = acaoPsico === 'ENCAMINHAR_PARA_HEROI' ||
        acaoPsico === 'ENCAMINHAR' ||
        cascata?.heroi_escolhido

      if (querEncaminhar) {
        // Extrair herói do pipeline processado
        let heroiEscolhido: string = cascata?.heroi_escolhido || ''

        // Normalizar nome do herói (LLM pode errar: VERBETA→VERBETTA, CALCULLUS→CALCULUS)
        heroiEscolhido = normalizarNomeHeroi(heroiEscolhido)

        // Se temos tema detectado por keywords, usar personaPorTema como override
        // (PSICO pode alucinar o heroi_escolhido, keywords são confiáveis)
        if (temaDetectado) {
          const heroiPorTema = personaPorTema(temaDetectado)
          if (heroiPorTema !== 'PSICOPEDAGOGICO' && heroiPorTema !== heroiEscolhido) {
            console.log(`[${aluno_id}] Override: PSICO escolheu ${heroiEscolhido}, keywords indicam ${heroiPorTema}. Usando keywords.`)
            heroiEscolhido = heroiPorTema
          }
        }

        if (heroiEscolhido && HEROIS_VALIDOS.includes(heroiEscolhido)) {
          console.log(`[${aluno_id}] PSICO gerou plano. Chamando ${heroiEscolhido} em stream...`)
          houveCascata = true
          agenteFinal = heroiEscolhido

          // ── SUPER PROVA Hook 1 (CASO A) ─────────────────────────────────────
          // Gerar/buscar acervo em PARALELO (não fire-and-forget)
          // temaEspecifico_A: prioriza super_prova_query do PSICO (ex: "quilombos_atualidade")
          // em vez do temaDetectado genérico (ex: "historia"). Garante KB relevante à aula.
          const temaEspecifico_A: string = (cascata?.super_prova_query as string)
            || (respostaJSON?.super_prova_query as string)
            || temaDetectado
            || ''
          // Iniciar geração imediatamente após detectar tema — await antes de buscarKnowledgeBase
          // Cache HIT retorna <100ms; MISS pode demorar mais → timeout de 4s protege latência
          let acervoPromise_A: Promise<Awaited<ReturnType<typeof obterOuGerarAcervo>> | null> = Promise.resolve(null)
          if (temaEspecifico_A && temaEspecifico_A !== sessao.tema_atual) {
            console.log(`[SuperProva] 🔄 Hook 1 iniciado em paralelo | ${heroiEscolhido} | tema: "${temaEspecifico_A}"`)
            acervoPromise_A = obterOuGerarAcervo(temaEspecifico_A, aluno.serie || '7ano', heroiParaMateria(heroiEscolhido), heroiEscolhido)
              .catch((): null => null)
          }
          // ────────────────────────────────────────────────────────────────────

          // Extrair plano do pipeline — priorizar plano_universal (Método Universal)
          const planoUniversalObj = cascata?.plano_universal ?? null
          const planoAtendimentoObj = cascata?.plano_atendimento
            || respostaJSON?.plano_atendimento
            || respostaJSON?.plano_pedagogico
            || respostaJSON?.plano
            || null
          if (planoUniversalObj) {
            plano = JSON.stringify(planoUniversalObj)  // compact — parseado por context.ts
          } else if (planoAtendimentoObj) {
            plano = JSON.stringify(planoAtendimentoObj, null, 2)
          }
          // Extrair instruções do pipeline processado (com fallback para JSON original)
          const instrucoesRaw = cascata?.instrucoes_para_heroi
            || respostaJSON?.instrucoes_para_heroi
            || respostaJSON?.instrucoes_para_agente
            || respostaJSON?.instrucoes
            || ''
          // Pode ser string ou objeto — serializar se necessário
          const instrucoesHeroi = typeof instrucoesRaw === 'string'
            ? instrucoesRaw
            : JSON.stringify(instrucoesRaw, null, 2)

          // ── SUPER PROVA: injetar KB e resultado de consulta anterior (CASO A) ─
          // Aguardar acervo com timeout 4s — garante KB disponível quando herói for chamado
          // Cache HIT (<100ms): KB sempre disponível. MISS/lento (>4s): degrada sem KB silenciosamente.
          const acervo_A = await Promise.race([
            acervoPromise_A,
            new Promise<null>(resolve => setTimeout(() => resolve(null), 4000))
          ])
          if (acervo_A) {
            await persistirKnowledgeBase(sessao.id, formatarKnowledgeBase(acervo_A)).catch(() => {})
          }

          const [spKB_A, spConsulta_A] = await Promise.all([
            buscarKnowledgeBase(sessao.id).catch(() => null),
            buscarConsultaResultado(sessao.id).catch(() => null),
          ])
          console.log(`[SuperProva] DIAGNÓSTICO Caso A | sessão=${sessao.id.slice(0,8)} | tema="${temaEspecifico_A}" | acervo=${acervo_A ? 'HIT' : 'MISS/TIMEOUT'} | KB=${spKB_A ? spKB_A.length + 'chars' : 'NULL'}`)

          // Atualizar tema e agente na sessão local antes de montar contexto (evita contexto stale)
          // Prioriza temaEspecifico_A (específico do PSICO) para que próximas reconexões preservem contexto real
          if (temaEspecifico_A) sessao.tema_atual = temaEspecifico_A
          else if (temaDetectado) sessao.tema_atual = temaDetectado
          sessao.agente_atual = heroiEscolhido

          // Persistir tema específico no banco para que CASO B em reconexão use tema correto
          // Sem isso, reconexão retorna tema genérico do banco ("historia") e Hook 1 gera acervo irrelevante
          if (temaEspecifico_A) {
            atualizarSessao(sessao.id, { tema_atual: temaEspecifico_A }).catch(() => {})
          }

          // Montar contexto rico para o herói
          let contextoHeroi = montarContexto(sessao, aluno, ultimosTurnos, tipoUsuario)

          if (spKB_A) {
            console.log(`[SuperProva] 📖 Injetando KNOWLEDGE_BASE no contexto do ${heroiEscolhido} (${spKB_A.length} chars)`)
            contextoHeroi += `\n\n${spKB_A}`
          }
          if (spConsulta_A) {
            console.log(`[SuperProva] 📨 Injetando CONSULTA_RESULTADO no contexto do ${heroiEscolhido}`)
            contextoHeroi += `\n\nCONSULTA_RESULTADO: ${spConsulta_A}`
            limparConsultaResultado(sessao.id).catch(() => {})
          }

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
          const resultadoHeroi: ResultadoStream = await chamarLLMStream(
            systemPromptHeroi,
            contextoHeroi,
            mensagem.trim(),
            heroiEscolhido,
            (chunk) => {
              respostaFinal += chunk
              enviarEvento('chunk', { texto: chunk })
            },
            imagemBase64  // herói vê a imagem original (não o "[foto anexada]" do PSICO)
          )

          // Bloco H: capturar sinais pedagógicos do herói
          sinaisHeroi = resultadoHeroi.processed.sinais
          if (sinaisHeroi?.sinal_psicopedagogico) {
            console.log(`[${aluno_id}] 🚨 SINAL PSICOPEDAGÓGICO de ${heroiEscolhido}: ${sinaisHeroi.motivo_sinal}`)
          }

          // ── SUPER PROVA Hooks 2+3 (CASO A cascata) ──────────────────────────
          {
            const heroJson_A = resultadoHeroi.processed.jsonOriginal
            const temaAtual_A = temaDetectado || sessao.tema_atual || ''
            const serie_A = aluno.serie || '7ano'
            const heroi_A = heroiEscolhido

            if (heroJson_A?.sinal_super_prova === 'CONSULTAR' && heroJson_A?.super_prova_query) {
              console.log(`[SuperProva] Hook 2 ativado (cascata) | "${heroJson_A.super_prova_query}"`)
              processarConsulta(heroJson_A.super_prova_query as string, temaAtual_A, serie_A, heroi_A)
                .then(resultado => {
                  if (resultado) return persistirConsultaResultado(sessao.id, resultado.resposta)
                })
                .catch(() => {})
            }

            if (heroJson_A?.sinal_super_prova === 'QUIZ') {
              console.log(`[SuperProva] Hook 3 ativado (cascata) — gerando quiz para ${heroi_A}`)
              // Monta resumo da sessão completa: entrada do aluno + resposta do herói (10 turnos × 400 chars)
              // super_prova_query do herói carrega os tópicos do plano_universal ("frações, equações")
              const temaQuiz_A = (heroJson_A?.super_prova_query as string | undefined) || temaAtual_A
              const resumo_A = ultimosTurnos
                .map(t => `[${t.agente}] Aluno: ${t.entrada.slice(0, 200)} | Herói: ${t.resposta.slice(0, 400)}`)
                .join('\n')
              // QUIZ precisa ser aguardado antes de res.end() — armazena promise para await posterior
              quizSsePromise = processarQuiz(temaQuiz_A, serie_A, heroi_A, resumo_A)
                .then(quiz => {
                  if (quiz) {
                    console.log(`[SuperProva] 🎯 Enviando SSE event 'quiz' — ${quiz.questoes.length} questões`)
                    res.write(`event: quiz\ndata: ${JSON.stringify(quiz)}\n\n`)
                  }
                })
                .catch(() => {})
            }
          }
          // ────────────────────────────────────────────────────────────────────

          // ── MÉTODO UNIVERSAL: avançar_topico (CASO A) ──────────────────────────
          {
            const heroJsonMU = resultadoHeroi.processed.jsonOriginal
            if (heroJsonMU?.['avançar_topico'] === true) {
              const planoAtivoStr = plano || sessao.plano_ativo
              if (planoAtivoStr) {
                try {
                  const planoMU = JSON.parse(planoAtivoStr) as Record<string, unknown>
                  if (planoMU.ativo === true && Array.isArray(planoMU.topicos) && typeof planoMU.topico_atual_id === 'number') {
                    type TopicoMU = { id: number; nome: string; status: string }
                    const topicosMU = planoMU.topicos as TopicoMU[]
                    const topicoAtualMU = topicosMU.find(t => t.id === planoMU.topico_atual_id)
                    if (topicoAtualMU) topicoAtualMU.status = 'concluido'
                    const proximoMU = topicosMU.find(t => t.status === 'pendente')
                    if (proximoMU) {
                      proximoMU.status = 'em_progresso'
                      planoMU.topico_atual_id = proximoMU.id
                      const planoAtualizado = JSON.stringify(planoMU)
                      plano = planoAtualizado
                      sessao.plano_ativo = planoAtualizado
                      console.log(`[MetodoUniversal] CasoA: avançando → tópico ${proximoMU.id} "${proximoMU.nome}"`)
                      enviarEvento('topico_avancado', { topico: proximoMU.nome, id: proximoMU.id })
                    } else {
                      // Todos os tópicos concluídos → QUIZ automático
                      planoMU.ativo = false
                      const planoFinalizado = JSON.stringify(planoMU)
                      plano = planoFinalizado
                      sessao.plano_ativo = planoFinalizado
                      console.log(`[MetodoUniversal] CasoA: plano concluído — disparando QUIZ automático`)
                      const temaQuizMU = temaEspecifico_A || temaDetectado || sessao.tema_atual || ''
                      const resumoMU = ultimosTurnos
                        .map(t => `[${t.agente}] Aluno: ${t.entrada.slice(0, 200)} | Herói: ${t.resposta.slice(0, 400)}`)
                        .join('\n')
                      quizSsePromise = processarQuiz(temaQuizMU, aluno.serie || '7ano', heroiEscolhido, resumoMU)
                        .then(quiz => {
                          if (quiz) {
                            console.log(`[MetodoUniversal] Quiz enviado (CasoA) — ${quiz.questoes.length} questões`)
                            res.write(`event: quiz\ndata: ${JSON.stringify(quiz)}\n\n`)
                          }
                        })
                        .catch(() => {})
                    }
                  }
                } catch {
                  console.log('[MetodoUniversal] Erro ao processar avançar_topico (CasoA)')
                }
              }
            }
          }
          // ── FIM MÉTODO UNIVERSAL (CASO A) ────────────────────────────────────

          chamadasMetricas.push({
            persona: heroiEscolhido,
            tempo_ms: resultadoHeroi.tempo_ms,
            tokens_input: resultadoHeroi.tokens_input,
            tokens_output: resultadoHeroi.tokens_output,
            tokens_total: resultadoHeroi.tokens_total,
            modelo: resultadoHeroi.modelo
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

      // Injetar memória longa do PROFESSOR_IA (se disponível no Qdrant)
      let contextoFinal = contexto
      if (persona === 'PROFESSOR_IA') {
        const responsavelId = sessao.responsavel_id || null
        const memoriaLonga = await buscarContextoProfessorIA(
          aluno_id,
          responsavelId,
          tipoUsuario
        ).catch(() => null)

        if (memoriaLonga) {
          contextoFinal = contexto +
            `\n\n═══════════════════════════════════════════\n` +
            `MEMÓRIA DE SESSÕES ANTERIORES (PROFESSOR_IA):\n` +
            `═══════════════════════════════════════════\n` +
            memoriaLonga +
            `\n═══════════════════════════════════════════\n` +
            `INSTRUÇÃO: Use esse histórico para continuar a jornada de onde parou. ` +
            `Não comece do zero. Reconheça o progresso já feito implicitamente.\n`
          console.log(`[${aluno_id}] PROFESSOR_IA: memória longa injetada (${memoriaLonga.length} chars)`)
        }
      }

      // ── SUPERVISOR_EDUCACIONAL: arquitetura dedicada ───────────────────────
      // Memória independente por sessão (b2c_supervisor_sessoes).
      // Flush automático quando nova_sessao=true.
      // Dados honestos: acessa apenas sessões 'filho' da filha selecionada.
      // Honesty layer: se zero dados, declara explicitamente.
      if (persona === 'SUPERVISOR_EDUCACIONAL') {
        // 1. Sessão própria do Supervisor — por família (flush ao entrar, não ao trocar filha)
        const sessaoSupervisor = await buscarOuCriarSessaoSupervisor(
          familia_id,
          nova_sessao === true
        )

        // 2. Dados em paralelo
        const [todasFilhas, turnosDaFilha, memoriaResultados, ultimaInteracao, nomeResponsavel] = await Promise.all([
          buscarFilhosDaFamilia(familia_id).catch(() => []),
          buscarTurnosDaFilha(aluno_id, 50, 30).catch(() => []),
          buscarContextoLongoPrazo(aluno_id, 'resumo pedagógico semanal do aluno', 3, 'educacional').catch(() => []),
          buscarUltimaInteracaoFilha(aluno_id).catch(() => null),
          buscarNomeResponsavel(familia_id).catch(() => null)
        ])

        const memoriaFilha = memoriaResultados.length > 0
          ? memoriaResultados.map(r => `[Semana ${r.semana_ref}]: ${r.resumo}`).join('\n\n')
          : null

        const listaFilhas = todasFilhas.map(f => `- ${f.nome} (${f.serie})`).join('\n')
        const filhaAtual = todasFilhas.find(f => f.id === aluno_id)
        const nomeFilhaAtual = filhaAtual?.nome || 'filha selecionada'

        // 3. Dados de atividade da filha
        let secaoDadosFilha: string
        if (turnosDaFilha.length === 0 && !memoriaFilha) {
          // ZERO DADOS — apenas o fato, sem instrução embutida
          const ultimaStr = ultimaInteracao
            ? `Última interação: ${new Date(ultimaInteracao).toLocaleDateString('pt-BR')}`
            : 'Nenhuma interação registrada'
          secaoDadosFilha =
            `SEM ATIVIDADES REGISTRADAS (${nomeFilhaAtual}):\n` +
            `${ultimaStr}\n`
        } else {
          // HÁ DADOS — formatar honestamente
          const NOMES_AGENTES: Record<string, string> = {
            CALCULUS: 'Matemática',
            VERBETTA: 'Português',
            NEURON: 'Ciências/Biologia',
            TEMPUS: 'História',
            GAIA: 'Geografia',
            VECTOR: 'Física',
            ALKA: 'Química',
            FLEX: 'Inglês/Espanhol',
            PSICOPEDAGOGICO: 'Orientação pedagógica',
            SUPERVISOR_EDUCACIONAL: 'Supervisor',
            PROFESSOR_IA: 'Professor de IA',
          }

          let partes = ''
          if (turnosDaFilha.length > 0) {
            const ordenados = [...turnosDaFilha].sort((a, b) => a.numero - b.numero)
            const turnos = ordenados.map(t => {
              const nomeAgente = NOMES_AGENTES[t.agente] || t.agente
              const data = new Date(t.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
              const entrada = t.entrada.length > 150 ? t.entrada.substring(0, 150) + '...' : t.entrada
              return `  [${data} — ${nomeAgente}] Pergunta: "${entrada}"`
            }).join('\n')
            partes += `CONVERSAS RECENTES DE ${nomeFilhaAtual.toUpperCase()} (últimos 30 dias):\n${turnos}\n`
          }
          if (memoriaFilha) {
            partes += `\nHISTÓRICO CONSOLIDADO (${nomeFilhaAtual}):\n${memoriaFilha}\n`
          }
          if (ultimaInteracao) {
            partes += `\nÚltima interação da filha: ${new Date(ultimaInteracao).toLocaleDateString('pt-BR')}\n`
          }
          secaoDadosFilha = partes
        }

        // 4. Histórico desta conversa com o pai (memória de sessão)
        let secaoHistorico = ''
        if (sessaoSupervisor.historico.length > 0) {
          const linhas = sessaoSupervisor.historico.map(h =>
            `[${h.role === 'pai' ? 'PAI' : 'SUPERVISOR'}]: ${h.conteudo}`
          ).join('\n')
          secaoHistorico =
            `\n═══════════════════════════════════════════\n` +
            `HISTÓRICO DESTA CONVERSA (memória de sessão):\n` +
            `═══════════════════════════════════════════\n` +
            linhas + '\n'
        }

        // 5. Contexto final — apenas dados, sem instruções embutidas
        const primeiraMsg = sessaoSupervisor.historico.length === 0
        const ultimaConversaPai = sessaoSupervisor.ultima_interacao_pai
          ? new Date(sessaoSupervisor.ultima_interacao_pai).toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })
          : null
        contextoFinal =
          (nomeResponsavel ? `RESPONSÁVEL: ${nomeResponsavel}\n` : '') +
          (ultimaConversaPai ? `ÚLTIMA CONVERSA COM O PAI: ${ultimaConversaPai}\n` : '') +
          `\nPERFIL DA FILHA SELECIONADA:\n` +
          `Nome: ${aluno.nome}, ${aluno.idade || '?'} anos, ${aluno.serie}\n` +
          (aluno.perfil ? `Perfil: ${aluno.perfil}\n` : '') +
          (aluno.dificuldades ? `Dificuldades: ${aluno.dificuldades}\n` : '') +
          (aluno.interesses ? `Interesses: ${aluno.interesses}\n` : '') +
          `\nFILHAS DESTA FAMÍLIA:\n${listaFilhas || '(sem filhos)'}\n` +
          `RELATÓRIO ATUAL: ${nomeFilhaAtual}\n` +
          (primeiraMsg ? `ABERTURA: primeira mensagem desta sessão\n` : '') +
          `\n` +
          secaoDadosFilha +
          secaoHistorico

        console.log(`[${familia_id}] SUPERVISOR: sessao=${sessaoSupervisor.id.slice(0,8)}, pai=${nomeResponsavel || '?'}, historico=${sessaoSupervisor.historico.length} items, filha=${nomeFilhaAtual}, turnos=${turnosDaFilha.length}, memoria=${!!memoriaFilha}, zeroDados=${turnosDaFilha.length === 0 && !memoriaFilha}`)
      }

      // ── SUPER PROVA Hook 1 (CASO B continuidade) ────────────────────────────
      // Herói já escolhido — verificar se tema mudou para gerar KB em background
      // temaEspecifico_B: usa sessao.tema_atual quando disponível (pode ter sido específico via Caso A anterior)
      // ex: se sessao.tema_atual = "quilombos_atualidade", KB é específico mesmo em reconexão
      const temaEspecifico_B: string = temaDetectado || sessao.tema_atual || ''
      if (temaEspecifico_B && temaEspecifico_B !== sessao.tema_atual && HEROIS_VALIDOS.includes(persona) && !linkKbSalvaNesteTurno) {
        console.log(`[SuperProva] 🔄 Hook 1 ativado (continuidade) | ${persona} | tema: "${temaEspecifico_B}"`)
        obterOuGerarAcervo(temaEspecifico_B, aluno.serie || '7ano', heroiParaMateria(persona), persona)
          .then(acervo => {
            if (acervo) return persistirKnowledgeBase(sessao.id, formatarKnowledgeBase(acervo))
          })
          .catch(() => {})
      }

      // ── SUPER PROVA: injetar KB e resultado de consulta anterior (CASO B) ──
      if (HEROIS_VALIDOS.includes(persona)) {
        const [spKB_B, spConsulta_B] = await Promise.all([
          buscarKnowledgeBase(sessao.id).catch(() => null),
          buscarConsultaResultado(sessao.id).catch(() => null),
        ])
        console.log(`[SuperProva] DIAGNÓSTICO Caso B | sessão=${sessao.id.slice(0,8)} | tema="${temaEspecifico_B}" | KB=${spKB_B ? spKB_B.length + 'chars' : 'NULL'}`)
        if (spKB_B) {
          console.log(`[SuperProva] 📖 Injetando KNOWLEDGE_BASE no contexto do ${persona} (${spKB_B.length} chars)`)
          contextoFinal += `\n\n${spKB_B}`
        }
        if (spConsulta_B) {
          console.log(`[SuperProva] 📨 Injetando CONSULTA_RESULTADO no contexto do ${persona}`)
          contextoFinal += `\n\nCONSULTA_RESULTADO: ${spConsulta_B}`
          limparConsultaResultado(sessao.id).catch(() => {})
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // Callback de busca: emite evento SSE 'search' antes da resposta (apenas PROFESSOR_IA)
      const onSearching = persona === 'PROFESSOR_IA'
        ? () => enviarEvento('search', { texto: '🔍 consultando fontes atualizadas...' })
        : undefined

      const resultadoHeroi: ResultadoStream = await chamarLLMStream(
        systemPrompt,
        contextoFinal,
        mensagem.trim(),
        persona,
        (chunk) => {
          respostaFinal += chunk
          enviarEvento('chunk', { texto: chunk })
        },
        imagemBase64,
        onSearching
      )

      // Salvar histórico do Supervisor após stream completo (respostaFinal preenchida)
      // AWAIT obrigatório: fire-and-forget causava race condition — próximo request chegava
      // antes do save completar, agente perdia memória do turno anterior e repetia tudo.
      if (persona === 'SUPERVISOR_EDUCACIONAL') {
        await salvarTurnoSupervisor(familia_id, mensagem.trim(), respostaFinal).catch(e =>
          console.error('[Supervisor] Erro ao salvar histórico:', e)
        )
      }

      // Bloco H: capturar sinais pedagógicos do herói
      sinaisHeroi = resultadoHeroi.processed.sinais
      if (sinaisHeroi?.sinal_psicopedagogico) {
        console.log(`[${aluno_id}] 🚨 SINAL PSICOPEDAGÓGICO de ${persona}: ${sinaisHeroi.motivo_sinal}`)
      }

      // ── SUPER PROVA Hooks 2+3 (CASO B continuidade) ─────────────────────────
      if (HEROIS_VALIDOS.includes(persona)) {
        const heroJson_B = resultadoHeroi.processed.jsonOriginal
        const temaAtual_B = temaDetectado || sessao.tema_atual || ''
        const serie_B = aluno.serie || '7ano'

        if (heroJson_B?.sinal_super_prova === 'CONSULTAR' && heroJson_B?.super_prova_query) {
          console.log(`[SuperProva] Hook 2 ativado (continuidade) | "${heroJson_B.super_prova_query}"`)
          processarConsulta(heroJson_B.super_prova_query as string, temaAtual_B, serie_B, persona)
            .then(resultado => {
              if (resultado) return persistirConsultaResultado(sessao.id, resultado.resposta)
            })
            .catch(() => {})
        }

        if (heroJson_B?.sinal_super_prova === 'QUIZ') {
          console.log(`[SuperProva] Hook 3 ativado (continuidade) — gerando quiz para ${persona}`)
          // Monta resumo da sessão completa: entrada do aluno + resposta do herói (10 turnos × 400 chars)
          // super_prova_query do herói carrega os tópicos do plano_universal ("frações, equações")
          const temaQuiz_B = (heroJson_B?.super_prova_query as string | undefined) || temaAtual_B
          const resumo_B = ultimosTurnos
            .map(t => `[${t.agente}] Aluno: ${t.entrada.slice(0, 200)} | Herói: ${t.resposta.slice(0, 400)}`)
            .join('\n')
          // QUIZ precisa ser aguardado antes de res.end() — armazena promise para await posterior
          quizSsePromise = processarQuiz(temaQuiz_B, serie_B, persona, resumo_B)
            .then(quiz => {
              if (quiz) {
                console.log(`[SuperProva] 🎯 Enviando SSE event 'quiz' — ${quiz.questoes.length} questões`)
                res.write(`event: quiz\ndata: ${JSON.stringify(quiz)}\n\n`)
              }
            })
            .catch(() => {})
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // ── MÉTODO UNIVERSAL: avançar_topico (CASO B) ──────────────────────────
      if (HEROIS_VALIDOS.includes(persona)) {
        const heroJsonMU_B = resultadoHeroi.processed.jsonOriginal
        if (heroJsonMU_B?.['avançar_topico'] === true) {
          const planoAtivoStr_B = plano || sessao.plano_ativo
          if (planoAtivoStr_B) {
            try {
              const planoMU_B = JSON.parse(planoAtivoStr_B) as Record<string, unknown>
              if (planoMU_B.ativo === true && Array.isArray(planoMU_B.topicos) && typeof planoMU_B.topico_atual_id === 'number') {
                type TopicoMU_B = { id: number; nome: string; status: string }
                const topicosMU_B = planoMU_B.topicos as TopicoMU_B[]
                const topicoAtualMU_B = topicosMU_B.find(t => t.id === planoMU_B.topico_atual_id)
                if (topicoAtualMU_B) topicoAtualMU_B.status = 'concluido'
                const proximoMU_B = topicosMU_B.find(t => t.status === 'pendente')
                if (proximoMU_B) {
                  proximoMU_B.status = 'em_progresso'
                  planoMU_B.topico_atual_id = proximoMU_B.id
                  const planoAtualizado_B = JSON.stringify(planoMU_B)
                  plano = planoAtualizado_B
                  sessao.plano_ativo = planoAtualizado_B
                  console.log(`[MetodoUniversal] CasoB: avançando → tópico ${proximoMU_B.id} "${proximoMU_B.nome}"`)
                  enviarEvento('topico_avancado', { topico: proximoMU_B.nome, id: proximoMU_B.id })
                } else {
                  // Todos os tópicos concluídos → QUIZ automático
                  planoMU_B.ativo = false
                  const planoFinalizado_B = JSON.stringify(planoMU_B)
                  plano = planoFinalizado_B
                  sessao.plano_ativo = planoFinalizado_B
                  console.log(`[MetodoUniversal] CasoB: plano concluído — disparando QUIZ automático`)
                  const temaQuizMU_B = temaDetectado || sessao.tema_atual || ''
                  const resumoMU_B = ultimosTurnos
                    .map(t => `[${t.agente}] Aluno: ${t.entrada.slice(0, 200)} | Herói: ${t.resposta.slice(0, 400)}`)
                    .join('\n')
                  quizSsePromise = processarQuiz(temaQuizMU_B, aluno.serie || '7ano', persona, resumoMU_B)
                    .then(quiz => {
                      if (quiz) {
                        console.log(`[MetodoUniversal] Quiz enviado (CasoB) — ${quiz.questoes.length} questões`)
                        res.write(`event: quiz\ndata: ${JSON.stringify(quiz)}\n\n`)
                      }
                    })
                    .catch(() => {})
                }
              }
            } catch {
              console.log('[MetodoUniversal] Erro ao processar avançar_topico (CasoB)')
            }
          }
        }
      }
      // ── FIM MÉTODO UNIVERSAL (CASO B) ────────────────────────────────────

      chamadasMetricas.push({
        persona,
        tempo_ms: resultadoHeroi.tempo_ms,
        tokens_input: resultadoHeroi.tokens_input,
        tokens_output: resultadoHeroi.tokens_output,
        tokens_total: resultadoHeroi.tokens_total,
        modelo: resultadoHeroi.modelo
      })
    }

    // ─── Finalizar ─────────────────────────────────────────────────────────
    const status = determinarStatus(mensagem, agenteFinal, sessao)
    const metricas = calcularMetricasRequest(aluno_id, inicio, chamadasMetricas, houveCascata)
    logMetricas(metricas)

    console.log(`[${aluno_id}] Resposta final (${agenteFinal}) em ${metricas.tempo_total_ms}ms`)

    // Aguardar QUIZ SSE antes de fechar stream (Hook 3 precisa escrever antes de res.end())
    if (quizSsePromise) {
      console.log('[SuperProva] ⏳ Aguardando geração do quiz antes de fechar SSE...')
      await quizSsePromise
      console.log('[SuperProva] ✅ Quiz SSE enviado — fechando stream')
    }

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
        plano,
        sinaisHeroi
      ),
      atualizarSessao(sessao.id, {
        turno_atual: novoTurno,
        agente_atual: agenteFinal,
        tema_atual: temaDetectado || sessao.tema_atual,
        plano_ativo: temaDetectado && temaDetectado !== sessao.tema_atual
          ? (plano || null)
          : (plano || sessao.plano_ativo)
      }),
      atualizarUltimoTurno(sessao.id)
    ])
      .then(() => {
        console.log(`[${aluno_id}] Persistência concluída (turno ${novoTurno})`)
        return incrementarUso(aluno_id)
      })
      .then(() => {
        console.log(`[${aluno_id}] Uso incrementado`)
        // Incrementar turno completo APENAS em troca de matéria
        // Um "turno" = sessão pedagógica com uma matéria, não uma mensagem
        const houveTrocaDeMateria = temaDetectado
          && sessao.tema_atual
          && temaDetectado !== sessao.tema_atual
        if (houveTrocaDeMateria) {
          console.log(`[${aluno_id}] Troca de matéria: ${sessao.tema_atual} → ${temaDetectado}. Incrementando turno completo.`)
          return incrementarTurnoCompleto(aluno_id)
        }
        return Promise.resolve()
      })
      .then(() => {
        console.log(`[${aluno_id}] Pós-persistência OK`)
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

// Normalizar nomes de heróis que o LLM pode errar
// Ex: VERBETA→VERBETTA, CALCULLUS→CALCULUS, verbetta→VERBETTA
function normalizarNomeHeroi(nome: string): string {
  if (!nome) return ''
  const upper = nome.trim().toUpperCase()

  // Mapa de typos conhecidos → nome correto
  const typos: Record<string, string> = {
    'VERBETA': 'VERBETTA',
    'VERBETA ': 'VERBETTA',
    'CALCULLUS': 'CALCULUS',
    'CALCULOS': 'CALCULUS',
    'NEUROM': 'NEURON',
    'TEMPOS': 'TEMPUS',
    'GAÍA': 'GAIA',
    'VETCOR': 'VECTOR',
    'VETOR': 'VECTOR',
    'ALCHA': 'ALKA',
    'FLES': 'FLEX',
  }

  if (typos[upper]) return typos[upper]

  // Fuzzy: encontrar herói mais parecido por distância de edição simples
  const herois = ['CALCULUS', 'VERBETTA', 'NEURON', 'TEMPUS', 'GAIA', 'VECTOR', 'ALKA', 'FLEX']
  for (const heroi of herois) {
    // Match exato ou começa com o nome do herói
    if (upper === heroi || upper.startsWith(heroi)) return heroi
    // Match por substring (ex: VERBETT → VERBETTA)
    if (heroi.startsWith(upper) && upper.length >= 3) return heroi
  }

  return upper
}

export default router
