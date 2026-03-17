// Testes unitários — response-processor.ts (Bloco H)
import { processarRespostaLLM } from '../src/core/response-processor.js'

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`)
  console.log(`  ✅ ${msg}`)
}

async function rodarTestes() {
  console.log('\n🧪 Testes do Response Processor (Bloco H)\n')

  // T1: JSON perfeito de herói → texto + sinais
  console.log('T1: JSON perfeito de herói')
  {
    const raw = JSON.stringify({
      agent_id: 'CALCULUS',
      tema: 'matematica',
      reply_text: 'Vamos dividir essa pizza em 4 pedaços!',
      sinal_psicopedagogico: true,
      motivo_sinal: 'dificuldade_persistente',
      observacoes_internas: 'Aluno errou frações 3x seguidas'
    })
    const r = processarRespostaLLM(raw, 'CALCULUS')
    assert(r.textoLimpo.includes('pizza'), 'Texto extraído do reply_text')
    assert(r.sinais?.sinal_psicopedagogico === true, 'Sinal detectado')
    assert(r.sinais?.motivo_sinal === 'dificuldade_persistente', 'Motivo extraído')
    assert(r.metadados.metodo_extracao === 'json_parse', 'Método: json_parse')
    assert(!r.metadados.usou_fallback, 'Sem fallback')
  }

  // T2: JSON perfeito de PSICO → cascata
  console.log('\nT2: JSON perfeito de PSICO')
  {
    const raw = JSON.stringify({
      acao: 'ENCAMINHAR_PARA_HEROI',
      resposta_para_aluno: 'Boa! Frações é um tema legal.',
      heroi_escolhido: 'CALCULUS',
      plano_atendimento: { tema: 'matematica', subtema: 'fracoes' },
      instrucoes_para_heroi: 'Aluno visual, usar pizza'
    })
    const r = processarRespostaLLM(raw, 'PSICOPEDAGOGICO')
    assert(r.cascata?.acao === 'ENCAMINHAR_PARA_HEROI', 'Ação cascata detectada')
    assert(r.cascata?.heroi_escolhido === 'CALCULUS', 'Herói extraído')
    assert(r.textoLimpo.includes('Frações'), 'Texto da resposta_para_aluno')
    assert(r.metadados.metodo_extracao === 'json_parse', 'Método: json_parse')
  }

  // T3: JSON dentro de markdown block
  console.log('\nT3: Markdown code block')
  {
    const raw = '```json\n{"agent_id":"VERBETTA","reply_text":"Vamos falar de crase!","sinal_psicopedagogico":false}\n```'
    const r = processarRespostaLLM(raw, 'VERBETTA')
    assert(r.textoLimpo.includes('crase'), 'Texto extraído do markdown block')
    assert(r.metadados.metodo_extracao === 'json_parse_markdown', 'Método: json_parse_markdown')
  }

  // T4: JSON truncado do PSICO → regex fallback
  console.log('\nT4: JSON truncado (PSICO)')
  {
    const raw = '{"acao":"ENCAMINHAR_PARA_HEROI","resposta_para_aluno":"Vou te ajudar com história!","heroi_escolhido":"TEMPUS","plano_atendimento":{"tema":"hist'
    const r = processarRespostaLLM(raw, 'PSICOPEDAGOGICO')
    assert(r.textoLimpo.includes('história'), 'Texto extraído por regex')
    assert(r.cascata?.heroi_escolhido === 'TEMPUS', 'Herói extraído por regex')
    assert(r.metadados.metodo_extracao === 'regex_fallback', 'Método: regex_fallback')
  }

  // T5: JSON com aspas malformadas → regex fallback
  console.log('\nT5: JSON malformado (aspas)')
  {
    const raw = `{"agent_id": "NEURON", "reply_text": "A célula é como uma fábrica!", "sinal_psicopedagogico": false, "observacoes_internas": "aluno engajado"}`
    // Corromper: trocar aspas por aspas inteligentes
    const corrompido = raw.replace(/"/g, '\u201c').replace(/\u201c/g, (m, i) => i % 2 === 0 ? '\u201c' : '\u201d')
    // Na verdade, vamos simular um JSON com aspas extras
    const malformado = '{"agent_id": "NEURON", "reply_text": "A célula é como uma "fábrica"!", "sinal_psicopedagogico": false}'
    const r = processarRespostaLLM(malformado, 'NEURON')
    // Deve usar regex_fallback por causa da aspas extra que invalida o JSON
    assert(r.metadados.metodo_extracao === 'regex_fallback', 'Método: regex_fallback para JSON malformado')
    assert(r.textoLimpo.includes('célula'), 'Texto parcialmente extraído')
  }

  // T6: Texto puro sem JSON
  console.log('\nT6: Texto puro')
  {
    const raw = 'Vamos estudar juntos! A fotossíntese é um processo incrível da natureza.'
    const r = processarRespostaLLM(raw, 'NEURON')
    assert(r.textoLimpo.includes('fotossíntese'), 'Texto preservado')
    assert(r.sinais === null, 'Sem sinais (texto puro)')
    assert(r.metadados.metodo_extracao === 'texto_puro', 'Método: texto_puro')
    assert(!r.metadados.usou_fallback, 'Sem fallback')
  }

  // T7: JSON inteiro como texto → sanitizador + fallback
  console.log('\nT7: JSON raw que vaza como texto')
  {
    // Simula JSON válido que tem campos mas reply_text contém JSON residual
    const raw = JSON.stringify({
      agent_id: 'CALCULUS',
      tema: 'matematica',
      reply_text: 'Aqui está: {"agent_id": "CALCULUS", "resposta": "teste"} vamos estudar!',
      sinal_psicopedagogico: false
    })
    const r = processarRespostaLLM(raw, 'CALCULUS')
    assert(!r.textoLimpo.includes('"agent_id"'), 'Sanitizador removeu JSON residual do texto')
    assert(r.metadados.sanitizado === true, 'Flag sanitizado = true')
  }

  // T8: Input vazio/garbage → fallback
  console.log('\nT8: Input vazio')
  {
    const r = processarRespostaLLM('', 'CALCULUS')
    assert(r.textoLimpo.includes('matemática'), 'Fallback do CALCULUS')
    assert(r.metadados.usou_fallback, 'Flag usou_fallback')
  }

  // T9: PSICO resposta direta (PERGUNTAR_AO_ALUNO)
  console.log('\nT9: PSICO PERGUNTAR_AO_ALUNO')
  {
    const raw = JSON.stringify({
      acao: 'PERGUNTAR_AO_ALUNO',
      resposta_para_aluno: 'Me conta: em que matéria você está com dúvida?',
      heroi_escolhido: null,
      plano_atendimento: null,
      instrucoes_para_heroi: null
    })
    const r = processarRespostaLLM(raw, 'PSICOPEDAGOGICO')
    assert(r.cascata?.acao === 'PERGUNTAR_AO_ALUNO', 'Ação PERGUNTAR detectada')
    assert(r.textoLimpo.includes('matéria'), 'Texto da pergunta ao aluno')
    assert(r.cascata?.heroi_escolhido === null, 'Sem herói (pergunta)')
  }

  console.log('\n✅ Todos os 9 testes passaram!\n')
}

rodarTestes().catch(e => {
  console.error('\n❌ TESTE FALHOU:', e.message)
  process.exit(1)
})
