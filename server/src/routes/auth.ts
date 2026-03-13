// Rotas de autenticação — login e seleção de perfil
import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {
  buscarFamiliaPorEmail,
  validarSenhaFamilia,
  buscarFilhosDaFamilia,
  buscarResponsavel,
  validarPinResponsavel
} from '../db/auth-queries.js'
import type { Familia, Aluno, Responsavel, Sessao } from '../db/supabase.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'super-agentes-dev-secret'

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body

    // Validação básica
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ erro: 'email é obrigatório' })
    }
    if (!senha || typeof senha !== 'string' || senha.trim() === '') {
      return res.status(400).json({ erro: 'senha é obrigatória' })
    }

    // Buscar família
    const familia = await buscarFamiliaPorEmail(email)
    if (!familia) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' })
    }

    // Validar senha
    const senhaValida = await validarSenhaFamilia(familia, senha)
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' })
    }

    // Gerar JWT
    const token = jwt.sign(
      {
        familia_id: familia.id,
        email: familia.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Buscar filhos
    const filhos = await buscarFilhosDaFamilia(familia.id)

    // Buscar responsável (pai)
    const responsavel = await buscarResponsavel(familia.id)

    console.log(`[Auth] Login bem-sucedido: ${email}`)

    return res.json({
      token,
      familia: {
        id: familia.id,
        email: familia.email,
        plano: familia.plano,
        status: familia.status
      },
      filhos: filhos.map(f => ({
        id: f.id,
        nome: f.nome,
        serie: f.serie,
        nivel_ensino: f.nivel_ensino
      })),
      responsavel: responsavel ? {
        id: responsavel.id,
        nome: responsavel.nome
      } : null
    })
  } catch (erro: any) {
    console.error('[Auth] Erro no login:', erro.message)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

// ============================================================
// POST /api/auth/select-profile
// ============================================================
router.post('/select-profile', async (req: Request, res: Response) => {
  try {
    const { perfil_id, tipo, pin } = req.body

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

    // Validação de entrada
    if (!perfil_id || !tipo) {
      return res.status(400).json({ erro: 'perfil_id e tipo são obrigatórios' })
    }

    if (tipo !== 'filho' && tipo !== 'pai') {
      return res.status(400).json({ erro: 'tipo deve ser "filho" ou "pai"' })
    }

    // ─── Modo Pai ───────────────────────────────────────────────
    if (tipo === 'pai') {
      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ erro: 'PIN é obrigatório para acesso ao modo pai' })
      }

      const responsavel = await buscarResponsavel(familia_id)
      if (!responsavel) {
        return res.status(403).json({ erro: 'Responsável não encontrado' })
      }

      const pinValido = await validarPinResponsavel(responsavel, pin)
      if (!pinValido) {
        return res.status(403).json({ erro: 'PIN inválido' })
      }

      console.log(`[Auth] Modo PAI ativado para responsável ${responsavel.id}`)

      return res.json({
        sessao: {
          familia_id,
          responsavel_id: responsavel.id,
          tipo_usuario: 'pai'
        },
        tipo_interface: 'pai'
      })
    }

    // ─── Modo Filho ─────────────────────────────────────────────
    // Buscar aluno
    const { buscarAluno } = await import('../db/persistence.js')
    const aluno = await buscarAluno(perfil_id) as Aluno & { familia_id: string }

    // Validar que o aluno pertence à família logada
    if (aluno.familia_id !== familia_id) {
      return res.status(403).json({ erro: 'Aluno não pertence à sua família' })
    }

    // Determinar tipo_interface baseado em nivel_ensino
    let tipo_interface = 'fundamental'
    if (aluno.nivel_ensino === 'medio') {
      tipo_interface = 'medio'
    }

    console.log(`[Auth] Modo FILHO ativado: ${aluno.nome} (${tipo_interface})`)

    return res.json({
      sessao: {
        aluno_id: aluno.id,
        familia_id,
        tipo_usuario: 'filho'
      },
      tipo_interface,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        serie: aluno.serie,
        nivel_ensino: aluno.nivel_ensino
      }
    })
  } catch (erro: any) {
    console.error('[Auth] Erro ao selecionar perfil:', erro.message)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

export default router
