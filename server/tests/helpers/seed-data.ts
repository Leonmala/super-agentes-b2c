import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const TEST_EMAIL = 'teste-gate1@superagentes.com'
const TEST_SENHA = 'senha123'
const TEST_PIN = '1234'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function seedTestFamily(): Promise<{
  familia: { id: string; email: string }
  responsavel: { id: string; nome: string }
  alunoFundamental: { id: string; nome: string; serie: string; nivel_ensino: string }
  alunoMedio: { id: string; nome: string; serie: string; nivel_ensino: string }
}> {
  // Delete existing test family if exists
  try {
    const existing = await supabase
      .from('b2c_familias')
      .select('id')
      .eq('email', TEST_EMAIL)
      .single()

    if (existing.data?.id) {
      await cleanupTestData(existing.data.id)
    }
  } catch (e) {
    // Doesn't exist yet, that's fine
  }

  // Create familia
  const senhaHash = await bcrypt.hash(TEST_SENHA, 10)
  const familiaRes = await supabase
    .from('b2c_familias')
    .insert({
      email: TEST_EMAIL,
      senha_hash: senhaHash,
      plano: 'base',
      status: 'ativa'
    })
    .select()
    .single()

  if (familiaRes.error) {
    throw new Error(`Failed to create test familia: ${familiaRes.error.message}`)
  }

  const familia = familiaRes.data as any

  // Create responsavel
  const pinHash = await bcrypt.hash(TEST_PIN, 10)
  const respRes = await supabase
    .from('b2c_responsaveis')
    .insert({
      familia_id: familia.id,
      nome: 'Responsável Teste',
      pin_hash: pinHash
    })
    .select()
    .single()

  if (respRes.error) {
    throw new Error(`Failed to create responsavel: ${respRes.error.message}`)
  }

  const responsavel = respRes.data as any

  // Create aluno fundamental
  const alunoFundRes = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: familia.id,
      nome: 'Aluno Fund Teste',
      serie: '5º ano',
      idade: 10,
      nivel_ensino: 'fundamental'
    })
    .select()
    .single()

  if (alunoFundRes.error) {
    throw new Error(`Failed to create aluno fundamental: ${alunoFundRes.error.message}`)
  }

  const alunoFundamental = alunoFundRes.data as any

  // Create aluno medio
  const alunoMedRes = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: familia.id,
      nome: 'Aluno EM Teste',
      serie: '2º EM',
      idade: 16,
      nivel_ensino: 'medio'
    })
    .select()
    .single()

  if (alunoMedRes.error) {
    throw new Error(`Failed to create aluno medio: ${alunoMedRes.error.message}`)
  }

  const alunoMedio = alunoMedRes.data as any

  return {
    familia: {
      id: familia.id,
      email: familia.email
    },
    responsavel: {
      id: responsavel.id,
      nome: responsavel.nome
    },
    alunoFundamental: {
      id: alunoFundamental.id,
      nome: alunoFundamental.nome,
      serie: alunoFundamental.serie,
      nivel_ensino: alunoFundamental.nivel_ensino
    },
    alunoMedio: {
      id: alunoMedio.id,
      nome: alunoMedio.nome,
      serie: alunoMedio.serie,
      nivel_ensino: alunoMedio.nivel_ensino
    }
  }
}

export async function cleanupTestData(familiaId: string): Promise<void> {
  // Delete in order: turnos → sessoes → uso_diario → alunos → responsaveis → familias

  // Get all alunos first
  const alunosRes = await supabase
    .from('b2c_alunos')
    .select('id')
    .eq('familia_id', familiaId)

  if (alunosRes.data) {
    const alunoIds = alunosRes.data.map((a: any) => a.id)

    // Delete turnos via sessoes
    for (const alunoId of alunoIds) {
      const sessoesRes = await supabase
        .from('b2c_sessoes')
        .select('id')
        .eq('aluno_id', alunoId)

      if (sessoesRes.data) {
        const sessaoIds = sessoesRes.data.map((s: any) => s.id)

        // Delete turnos
        if (sessaoIds.length > 0) {
          await supabase
            .from('b2c_turnos')
            .delete()
            .in('sessao_id', sessaoIds)
        }

        // Delete sessoes
        await supabase
          .from('b2c_sessoes')
          .delete()
          .eq('aluno_id', alunoId)
      }

      // Delete uso_diario
      await supabase
        .from('b2c_uso_diario')
        .delete()
        .eq('aluno_id', alunoId)
    }

    // Delete alunos
    await supabase
      .from('b2c_alunos')
      .delete()
      .eq('familia_id', familiaId)
  }

  // Delete responsaveis
  await supabase
    .from('b2c_responsaveis')
    .delete()
    .eq('familia_id', familiaId)

  // Delete familia
  await supabase
    .from('b2c_familias')
    .delete()
    .eq('id', familiaId)
}

// Create a dedicated aluno for router tests with pre-seeded hero turns
// Isolated from Message SSE tests to avoid state contamination
export async function seedRouterAluno(familiaId: string): Promise<{ alunoId: string; sessaoId: string }> {
  const alunoRes = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: familiaId,
      nome: 'Aluno Router Teste',
      serie: '5º ano',
      idade: 10,
      nivel_ensino: 'fundamental'
    })
    .select()
    .single()

  if (alunoRes.error) {
    throw new Error(`Failed to create router aluno: ${alunoRes.error.message}`)
  }

  const alunoId = (alunoRes.data as any).id
  const sessaoId = await seedHeroTurns(alunoId)
  return { alunoId, sessaoId }
}

// Seed turnos prévios para cada herói na sessão do aluno
// Isso garante que o router reconheça heróis como "já atendidos"
// e faça roteamento direto sem cascata PSICO
export async function seedHeroTurns(alunoId: string): Promise<string> {
  // Criar sessão
  const sessaoRes = await supabase
    .from('b2c_sessoes')
    .insert({
      aluno_id: alunoId,
      tipo_usuario: 'filho',
      turno_atual: 8,
      agente_atual: 'CALCULUS',
      tema_atual: 'matematica',
      status: 'ativa'
    })
    .select()
    .single()

  if (sessaoRes.error) {
    throw new Error(`Failed to create test sessao: ${sessaoRes.error.message}`)
  }

  const sessaoId = (sessaoRes.data as any).id

  // Inserir 1 turno para cada herói (para que decidirPersona veja jaAtendido=true)
  const heroisTurnos = [
    { numero: 1, agente: 'CALCULUS', entrada: 'frações', resposta: 'Vamos aprender!' },
    { numero: 2, agente: 'VERBETTA', entrada: 'redação', resposta: 'Vamos escrever!' },
    { numero: 3, agente: 'NEURON', entrada: 'célula', resposta: 'Vamos investigar!' },
    { numero: 4, agente: 'TEMPUS', entrada: 'história', resposta: 'Vamos viajar no tempo!' },
    { numero: 5, agente: 'GAIA', entrada: 'biomas', resposta: 'Vamos explorar!' },
    { numero: 6, agente: 'VECTOR', entrada: 'velocidade', resposta: 'Vamos calcular!' },
    { numero: 7, agente: 'ALKA', entrada: 'química', resposta: 'Vamos reagir!' },
    { numero: 8, agente: 'FLEX', entrada: 'verb to be', resposta: 'Let us learn!' },
  ]

  const turnosInsert = heroisTurnos.map(t => ({
    sessao_id: sessaoId,
    numero: t.numero,
    agente: t.agente,
    entrada: t.entrada,
    resposta: t.resposta,
    status: 'CONTINUIDADE'
  }))

  const turnosRes = await supabase
    .from('b2c_turnos')
    .insert(turnosInsert)

  if (turnosRes.error) {
    throw new Error(`Failed to seed hero turns: ${turnosRes.error.message}`)
  }

  return sessaoId
}

// Create a dedicated aluno for regression tests (isolated from MODO PAI tests)
// Same as seedRouterAluno but separate instance to avoid state contamination
export async function seedRegressionAluno(familiaId: string): Promise<{ alunoId: string; sessaoId: string }> {
  const alunoRes = await supabase
    .from('b2c_alunos')
    .insert({
      familia_id: familiaId,
      nome: 'Aluno Regressao Teste',
      serie: '5º ano',
      idade: 10,
      nivel_ensino: 'fundamental'
    })
    .select()
    .single()

  if (alunoRes.error) {
    throw new Error(`Failed to create regression aluno: ${alunoRes.error.message}`)
  }

  const alunoId = (alunoRes.data as any).id
  const sessaoId = await seedHeroTurns(alunoId)
  return { alunoId, sessaoId }
}

export { TEST_EMAIL, TEST_SENHA, TEST_PIN }
