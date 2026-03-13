import { supabase } from './supabase.js'
import type { Familia, Responsavel, Aluno } from './supabase.js'
import bcrypt from 'bcryptjs'

// ============================================================
// BUSCA E VALIDAÇÃO
// ============================================================

export async function buscarFamiliaPorEmail(email: string): Promise<Familia | null> {
  const { data, error } = await supabase
    .from('b2c_familias')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return null
    }
    throw new Error(`Erro ao buscar família: ${error.message}`)
  }

  return data as Familia
}

export async function validarSenhaFamilia(familia: Familia, senha: string): Promise<boolean> {
  try {
    return await bcrypt.compare(senha, familia.senha_hash)
  } catch (err) {
    console.error('Erro ao validar senha:', err)
    return false
  }
}

export async function buscarFilhosDaFamilia(familiaId: string): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from('b2c_alunos')
    .select('*')
    .eq('familia_id', familiaId)
    .order('nome', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar filhos: ${error.message}`)
  }

  return (data || []) as Aluno[]
}

export async function buscarResponsavel(familiaId: string): Promise<Responsavel | null> {
  const { data, error } = await supabase
    .from('b2c_responsaveis')
    .select('*')
    .eq('familia_id', familiaId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erro ao buscar responsável: ${error.message}`)
  }

  return data as Responsavel
}

export async function validarPinResponsavel(responsavel: Responsavel, pin: string): Promise<boolean> {
  try {
    return await bcrypt.compare(pin, responsavel.pin_hash)
  } catch (err) {
    console.error('Erro ao validar PIN:', err)
    return false
  }
}

// ============================================================
// CRIAÇÃO (ONBOARDING)
// ============================================================

export async function criarFamilia(dados: {
  email: string
  senha: string
  plano: 'base' | 'familiar'
}): Promise<Familia> {
  const senhaHash = await bcrypt.hash(dados.senha, 10)

  const { data, error } = await supabase
    .from('b2c_familias')
    .insert({
      email: dados.email,
      senha_hash: senhaHash,
      plano: dados.plano,
      status: 'ativa'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar família: ${error.message}`)
  }

  return data as Familia
}

export async function criarResponsavel(dados: {
  familia_id: string
  nome: string
  pin: string
}): Promise<Responsavel> {
  const pinHash = await bcrypt.hash(dados.pin, 10)

  const { data, error } = await supabase
    .from('b2c_responsaveis')
    .insert({
      familia_id: dados.familia_id,
      nome: dados.nome,
      pin_hash: pinHash
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar responsável: ${error.message}`)
  }

  return data as Responsavel
}

export async function criarAluno(dados: {
  familia_id: string
  nome: string
  serie: string
  idade?: number
  nivel_ensino: 'fundamental' | 'medio'
  entrevista_psico?: Record<string, unknown>
}): Promise<Aluno> {
  const { data, error } = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: dados.familia_id,
      nome: dados.nome,
      serie: dados.serie,
      idade: dados.idade || null,
      nivel_ensino: dados.nivel_ensino,
      entrevista_psico: dados.entrevista_psico || null
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar aluno: ${error.message}`)
  }

  return data as Aluno
}
