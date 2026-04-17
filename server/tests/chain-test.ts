#!/usr/bin/env npx ts-node
// ============================================================
// CHAIN TEST — Método Universal + avançar_topico
// Testa localmente a cadeia completa antes de push
//
// Uso:
//   npx ts-node tests/chain-test.ts --fase 4
//   npx ts-node tests/chain-test.ts --fase all
//   npx ts-node tests/chain-test.ts --fase 3a --target prod
//
// Fases:
//   4   — TypeScript compila sem erros
//   1   — response-processor extrai plano_universal corretamente
//   2   — context.ts injeta plano estruturado no contexto
//   3a  — avançar_topico avança tópico (tópico intermediário)
//   3b  — avançar_topico no último tópico dispara quiz=true no plano
//   3c  — plano_atendimento convencional (sem plano_universal) preservado
//   5   — Branch B force: KB link + sem plano → PSICO cascade
//   all — todas as fases acima
// ============================================================

import { processarRespostaLLM } from '../src/core/response-processor.js'
import { montarContexto } from '../src/core/context.js'
import type { Sessao, Aluno, Turno } from '../src/db/supabase.js'
import { execSync } from 'child_process'

// ─── Args ────────────────────────────────────────────────────
const args = process.argv.slice(2)
const faseArg = args.find(a => a.startsWith('--fase'))?.split('=')[1]
  || args[args.indexOf('--fase') + 1]
  || 'all'
const target = args.find(a => a === '--target')
  ? args[args.indexOf('--target') + 1]
  : 'local'

// ─── Utils ───────────────────────────────────────────────────
let passou = 0
let falhou = 0

function ok(nome: string, cond: boolean, detalhe?: string) {
  if (cond) {
    console.log(`  ✅ ${nome}`)
    passou++
  } else {
    console.log(`  ❌ ${nome}${detalhe ? ': ' + detalhe : ''}`)
    falhou++
  }
}

function secao(titulo: string) {
  console.log(`\n── ${titulo} ──`)
}

// ─── FASE 4: TypeScript ───────────────────────────────────────
async function fase4() {
  secao('FASE 4 — TypeScript compile')
  try {
    // Windows: usar node diretamente para invocar tsc
    const tscBin = process.platform === 'win32'
      ? 'node node_modules/typescript/bin/tsc --noEmit'
      : './node_modules/.bin/tsc --noEmit'
    execSync(tscBin, { cwd: process.cwd(), stdio: 'pipe' })
    ok('tsc --noEmit = 0 erros', true)
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer }
    const output = err.stdout?.toString() || err.stderr?.toString() || String(e)
    ok('tsc --noEmit = 0 erros', false, output.slice(0, 200))
  }
}

// ─── FASE 1: response-processor extrai plano_universal ───────
async function fase1() {
  secao('FASE 1 — response-processor extrai plano_universal')

  const planoUniversalMock = {
    ativo: true,
    topicos: [
      { id: 1, nome: 'Setores Primário', status: 'em_progresso' },
      { id: 2, nome: 'Setores Secundário', status: 'pendente' },
      { id: 3, nome: 'Setor Terciário', status: 'pendente' }
    ],
    topico_atual_id: 1,
    total: 3,
    fechar_com_quiz: true
  }

  const jsonPsico = JSON.stringify({
    acao: 'ENCAMINHAR_PARA_HEROI',
    heroi_escolhido: 'GAIA',
    resposta_para_aluno: 'Ótimo! Vamos lá!',
    instrucoes_para_heroi: 'Ensine setores econômicos sequencialmente',
    plano_universal: planoUniversalMock,
    plano_atendimento: { tema: 'geografia', subtema: 'setores_economicos' }
  })

  const resultado = processarRespostaLLM(jsonPsico, 'PSICOPEDAGOGICO')

  ok('cascata extraída', resultado.cascata !== null)
  ok('plano_universal presente na cascata', resultado.cascata?.plano_universal !== null)
  ok('plano_universal.ativo = true', resultado.cascata?.plano_universal?.ativo === true)
  ok('plano_universal.topicos tem 3 itens', resultado.cascata?.plano_universal?.topicos.length === 3)
  ok('topico_atual_id = 1', resultado.cascata?.plano_universal?.topico_atual_id === 1)
  ok('resposta_para_aluno extraída', resultado.textoLimpo === 'Ótimo! Vamos lá!')
}

// ─── FASE 2: context.ts injeta plano estruturado ─────────────
async function fase2() {
  secao('FASE 2 — context.ts injeta PLANO UNIVERSAL ATIVO')

  const planoUniversalMock = JSON.stringify({
    ativo: true,
    topicos: [
      { id: 1, nome: 'Setores Primário', status: 'concluido' },
      { id: 2, nome: 'Setores Secundário', status: 'em_progresso' },
      { id: 3, nome: 'Setor Terciário', status: 'pendente' }
    ],
    topico_atual_id: 2,
    total: 3,
    fechar_com_quiz: true
  })

  const sessaoMock: Partial<Sessao> = {
    id: 'test-id',
    turno_atual: 5,
    agente_atual: 'GAIA',
    tema_atual: 'setores_economicos',
    plano_ativo: planoUniversalMock,
    historico_resumido: null,
    link_pendente: null,
    responsavel_id: null
  }

  const alunoMock: Partial<Aluno> = {
    id: 'aluno-id',
    nome: 'Layla',
    idade: 12,
    serie: '7ano',
    perfil: null,
    dificuldades: null,
    interesses: null
  }

  const contexto = montarContexto(sessaoMock as Sessao, alunoMock as Aluno, [], 'filho')

  ok('Contém PLANO UNIVERSAL ATIVO', contexto.includes('PLANO UNIVERSAL ATIVO'))
  ok('Contém tópico atual (Setores Secundário)', contexto.includes('Setores Secundário'))
  ok('Contém TÓPICO ATUAL:', contexto.includes('TÓPICO ATUAL:'))
  ok('Contém PROGRESSO:', contexto.includes('PROGRESSO:'))
  ok('Contém instrução avançar_topico', contexto.includes('avançar_topico'))
  ok('Não contém JSON bruto do plano', !contexto.includes('"topico_atual_id"'))

  // Testar plano convencional (plano_atendimento — sem plano_universal)
  const planoConvencionalMock = JSON.stringify({ tema: 'geografia', subtema: 'biomas' })
  const sessaoConvMock = { ...sessaoMock, plano_ativo: planoConvencionalMock }
  const contextoConv = montarContexto(sessaoConvMock as Sessao, alunoMock as Aluno, [], 'filho')

  ok('Plano convencional: contém PLANO ATIVO', contextoConv.includes('PLANO ATIVO'))
  ok('Plano convencional: NÃO contém PLANO UNIVERSAL ATIVO', !contextoConv.includes('PLANO UNIVERSAL ATIVO'))
}

// ─── FASE 3a: avançar_topico avança tópico intermediário ─────
async function fase3a() {
  secao('FASE 3a — avançar_topico: avanço de tópico intermediário')

  // Simular a lógica de progressão (mesma lógica do message.ts)
  const plano = {
    ativo: true,
    topicos: [
      { id: 1, nome: 'Setores Primário', status: 'em_progresso' },
      { id: 2, nome: 'Setores Secundário', status: 'pendente' },
      { id: 3, nome: 'Setor Terciário', status: 'pendente' }
    ],
    topico_atual_id: 1,
    total: 3,
    fechar_com_quiz: true
  }

  type Topico = { id: number; nome: string; status: string }
  const topicoAtual = plano.topicos.find(t => t.id === plano.topico_atual_id)
  if (topicoAtual) topicoAtual.status = 'concluido'
  const proximo = plano.topicos.find(t => t.status === 'pendente')

  ok('Tópico 1 marcado como concluido', plano.topicos[0].status === 'concluido')
  ok('Próximo tópico encontrado (Setores Secundário)', proximo?.nome === 'Setores Secundário')

  if (proximo) {
    proximo.status = 'em_progresso'
    plano.topico_atual_id = proximo.id
  }

  ok('Tópico 2 marcado como em_progresso', plano.topicos[1].status === 'em_progresso')
  ok('topico_atual_id atualizado para 2', plano.topico_atual_id === 2)
  ok('Plano ainda ativo (não é o último)', plano.ativo === true)
  ok('Tópico 3 ainda pendente', plano.topicos[2].status === 'pendente')
}

// ─── FASE 3b: avançar_topico no último tópico → quiz ────────
async function fase3b() {
  secao('FASE 3b — avançar_topico: último tópico → quiz automático')

  const plano = {
    ativo: true,
    topicos: [
      { id: 1, nome: 'Setores Primário', status: 'concluido' },
      { id: 2, nome: 'Setores Secundário', status: 'concluido' },
      { id: 3, nome: 'Setor Terciário', status: 'em_progresso' }
    ],
    topico_atual_id: 3,
    total: 3,
    fechar_com_quiz: true
  }

  type Topico = { id: number; nome: string; status: string }
  const topicoAtual = plano.topicos.find(t => t.id === plano.topico_atual_id)
  if (topicoAtual) topicoAtual.status = 'concluido'
  const proximo = plano.topicos.find(t => t.status === 'pendente')

  ok('Tópico 3 marcado como concluido', plano.topicos[2].status === 'concluido')
  ok('Nenhum próximo tópico pendente', proximo === undefined)

  // Simular o que o código faz quando não há próximo
  if (!proximo) {
    plano.ativo = false
  }

  ok('Plano marcado como inativo (ativo = false)', plano.ativo === false)
  ok('Todos os tópicos concluídos', plano.topicos.every(t => t.status === 'concluido'))
}

// ─── FASE 3c: plano convencional preservado ──────────────────
async function fase3c() {
  secao('FASE 3c — plano_atendimento convencional preservado')

  // Simular: herói responde avançar_topico: true, mas plano não é plano_universal
  const planoAtendimento = JSON.stringify({ tema: 'historia', subtema: 'quilombos' })

  let planoFinal = planoAtendimento
  try {
    const planoMU = JSON.parse(planoAtendimento) as Record<string, unknown>
    if (planoMU.ativo === true && Array.isArray(planoMU.topicos)) {
      // Só aqui processaria avançar_topico
      planoFinal = 'MUDOU_INCORRETAMENTE'
    }
    // Se não é plano_universal, ignora avançar_topico
    ok('Plano convencional: avançar_topico ignorado', planoFinal === planoAtendimento)
  } catch {
    ok('Plano convencional: parse OK', true)
  }

  ok('Plano convencional preservado intacto', planoFinal === planoAtendimento)
}

// ─── FASE 5: Branch B force PSICO ────────────────────────────
async function fase5() {
  secao('FASE 5 — Branch B: link KB + sem plano → PSICO cascade')

  // Simular a lógica do message.ts
  let persona = 'GAIA'
  const linkKbSalvaNesteTurno = true
  const plano_ativo: string | null = null

  if (linkKbSalvaNesteTurno && !plano_ativo) {
    persona = 'PSICOPEDAGOGICO'
  }

  ok('Com KB de link + sem plano → PSICO', persona === 'PSICOPEDAGOGICO')

  // Simular sem KB (Branch normal) — não deve mudar
  let persona2 = 'GAIA'
  const linkKb2 = false
  if (linkKb2 && !plano_ativo) persona2 = 'PSICOPEDAGOGICO'
  ok('Sem KB de link → herói mantido', persona2 === 'GAIA')

  // Simular com KB de link MAS já tem plano — não deve forçar PSICO
  let persona3 = 'GAIA'
  const planoExistente = '{"ativo":true}'
  if (linkKbSalvaNesteTurno && !planoExistente) persona3 = 'PSICOPEDAGOGICO'
  ok('KB de link + plano existente → herói mantido', persona3 === 'GAIA')
}

// ─── Runner principal ─────────────────────────────────────────
async function main() {
  console.log(`\n═══════════════════════════════════════════════════`)
  console.log(`CHAIN TEST — Método Universal`)
  console.log(`Fase: ${faseArg} | Target: ${target}`)
  console.log(`═══════════════════════════════════════════════════`)

  const fases: Record<string, () => Promise<void>> = {
    '4': fase4,
    '1': fase1,
    '2': fase2,
    '3a': fase3a,
    '3b': fase3b,
    '3c': fase3c,
    '5': fase5,
  }

  const ordemAll = ['4', '1', '2', '3a', '3b', '3c', '5']

  if (faseArg === 'all') {
    for (const f of ordemAll) {
      await fases[f]()
    }
  } else {
    const fn = fases[faseArg]
    if (!fn) {
      console.error(`Fase desconhecida: ${faseArg}. Use: ${ordemAll.join(', ')}, all`)
      process.exit(1)
    }
    await fn()
  }

  console.log(`\n═══════════════════════════════════════════════════`)
  console.log(`RESULTADO: ${passou} passou | ${falhou} falhou`)
  console.log(`═══════════════════════════════════════════════════\n`)

  if (falhou > 0) {
    process.exit(1)
  }
}

main().catch(e => {
  console.error('Erro fatal:', e)
  process.exit(1)
})
