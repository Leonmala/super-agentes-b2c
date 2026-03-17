// MCP Bridge — endpoints para testes interativos
// JWT + PIN validation obrigatório

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {
  buscarOuCriarSessao,
  buscarUltimosTurnos,
  resetarSessaoAgente
} from '../db/persistence.js'
import {
  decidirPersona,
  detectarTema
} from '../core/router.js'
import {
  buscarResponsavel,
  validarPinResponsavel
} from '../db/auth-queries.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super-agentes-dev-secret'

// Rate limiting simples (em memória)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000

function checkRateLimit(tokenHash: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(tokenHash)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(tokenHash, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Middleware de autenticação — JWT + PIN do responsável
async function autenticarMCP(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token JWT obrigatório' })
    return
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as {
      familia_id: string
      email: string
    }

    // Validar PIN do responsável (obrigatório)
    const pin = req.headers['x-pin'] as string
    if (!pin) {
      res.status(401).json({ erro: 'Header X-Pin obrigatório (PIN do responsável)' })
      return
    }

    const responsavel = await buscarResponsavel(decoded.familia_id)
    if (!responsavel) {
      res.status(401).json({ erro: 'Responsável não encontrado para esta família' })
      return
    }
    const pinValido = await validarPinResponsavel(responsavel, pin)
    if (!pinValido) {
      res.status(401).json({ erro: 'PIN inválido — acesso restrito a responsáveis' })
      return
    }

    // Rate limit
    if (!checkRateLimit(decoded.familia_id)) {
      res.status(429).json({ erro: 'Rate limit excedido (30 req/min)' })
      return
    }

    // Cleanup expired entries
    const now = Date.now()
    for (const [key, data] of rateLimits.entries()) {
      if (now > data.resetAt) rateLimits.delete(key)
    }

    ;(req as any).familia_id = decoded.familia_id
    ;(req as any).email = decoded.email
    next()
  } catch {
    res.status(401).json({ erro: 'Token JWT inválido' })
  }
}

router.use(autenticarMCP)

// 1. POST /enviar_mensagem — simula roteamento (dry-run, não chama LLM)
router.post('/enviar_mensagem', async (req: Request, res: Response) => {
  try {
    const { aluno_id, mensagem } = req.body
    if (!aluno_id || !mensagem) {
      res.status(400).json({ erro: 'aluno_id e mensagem obrigatórios' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, 10)
    const { persona, temaDetectado } = await decidirPersona(mensagem, sessao, turnos)

    res.json({
      resultado: 'ok',
      persona_escolhida: persona,
      tema_detectado: temaDetectado,
      sessao_id: sessao.id,
      nota: 'Mensagem roteada mas NÃO enviada ao LLM (apenas simulação de roteamento)',
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// 2. GET /verificar_sessao/:aluno_id
router.get('/verificar_sessao/:aluno_id', async (req: Request, res: Response) => {
  try {
    const sessao = await buscarOuCriarSessao(req.params.aluno_id)
    res.json({
      sessao_id: sessao.id,
      agente_atual: sessao.agente_atual,
      tema_atual: sessao.tema_atual,
      ultimo_turno_at: sessao.ultimo_turno_at,
      turno_atual: sessao.turno_atual,
      status: sessao.status,
      transicao_pendente: sessao.transicao_pendente,
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// 3. POST /checar_roteamento — dry-run detalhado
router.post('/checar_roteamento', async (req: Request, res: Response) => {
  try {
    const { aluno_id, mensagem } = req.body
    if (!aluno_id || !mensagem) {
      res.status(400).json({ erro: 'aluno_id e mensagem obrigatórios' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, 10)
    const temaKeywords = detectarTema(mensagem)
    const { persona, temaDetectado } = await decidirPersona(mensagem, sessao, turnos)

    res.json({
      tema_keywords: temaKeywords,
      tema_final: temaDetectado,
      persona,
      agente_atual_sessao: sessao.agente_atual,
      tema_atual_sessao: sessao.tema_atual,
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// 4. GET /listar_turnos/:aluno_id
router.get('/listar_turnos/:aluno_id', async (req: Request, res: Response) => {
  try {
    const limite = parseInt(req.query.limite as string) || 10
    const sessao = await buscarOuCriarSessao(req.params.aluno_id)
    const turnos = await buscarUltimosTurnos(sessao.id, limite)

    res.json({
      sessao_id: sessao.id,
      total: turnos.length,
      turnos: turnos.map(t => ({
        numero: t.numero,
        agente: t.agente,
        entrada: t.entrada.substring(0, 100) + (t.entrada.length > 100 ? '...' : ''),
        resposta: t.resposta.substring(0, 200) + (t.resposta.length > 200 ? '...' : ''),
        status: t.status,
        created_at: t.created_at,
      })),
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

// 5. POST /resetar_sessao — reset de teste
router.post('/resetar_sessao', async (req: Request, res: Response) => {
  try {
    const { aluno_id } = req.body
    if (!aluno_id) {
      res.status(400).json({ erro: 'aluno_id obrigatório' })
      return
    }

    const sessao = await buscarOuCriarSessao(aluno_id)
    await resetarSessaoAgente(sessao.id)

    res.json({
      resultado: 'ok',
      sessao_id: sessao.id,
      mensagem: 'Sessão resetada: agente_atual=PSICOPEDAGOGICO, tema_atual=null',
    })
  } catch (err) {
    res.status(500).json({ erro: (err as Error).message })
  }
})

export default router
