/**
 * GATE — Router Classificador: 300 Casos
 *
 * Testa `detectarTema` exaustivamente:
 *   - Casos claros por matéria (devem detectar a matéria correta)
 *   - Falsos positivos por SUBSTRING (ex: 'rio' em 'próprio' → NÃO deve ser geografia)
 *   - Falsos positivos SEMÂNTICOS (ex: 'mais fácil' → NÃO deve ser matemática)
 *   - Mensagens SOCIAIS/EMOCIONAIS (devem retornar null — nenhuma matéria)
 *   - Trocas de matéria EXPLÍCITAS (devem detectar a nova matéria)
 *
 * Executar:
 *   cd server && npx tsx --test tests/router-classificador.test.ts
 *
 * TDD: Os casos de falsos positivos devem FALHAR no código atual.
 *      Após os 3 fixes em router.ts, todos devem PASSAR.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectarTema } from '../src/core/router.js'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: data-driven test runner
// ─────────────────────────────────────────────────────────────────────────────

interface Caso {
  msg: string
  esperado: string | null
  desc?: string // descrição extra (opcional)
}

function runCasos(casos: Caso[]) {
  for (const caso of casos) {
    const label = caso.desc
      ? `"${caso.msg.substring(0, 50)}" → ${caso.esperado ?? 'null'} [${caso.desc}]`
      : `"${caso.msg.substring(0, 60)}" → ${caso.esperado ?? 'null'}`
    it(label, () => {
      const resultado = detectarTema(caso.msg)
      assert.strictEqual(
        resultado,
        caso.esperado,
        `esperado=${caso.esperado ?? 'null'}, recebido=${resultado ?? 'null'}`
      )
    })
  }
}

// =============================================================================
// SEÇÃO A — CASOS CLAROS POR MATÉRIA (devem detectar corretamente)
// =============================================================================

describe('A — Matemática clara', () => {
  runCasos([
    { msg: 'me ajuda com equação do segundo grau', esperado: 'matematica' },
    { msg: 'não entendo fração', esperado: 'matematica' },
    { msg: 'como calculo porcentagem?', esperado: 'matematica' },
    { msg: 'o que é tabuada?', esperado: 'matematica' },
    { msg: 'quanto é 3/4 de 60?', esperado: 'matematica' },
    { msg: 'me explica divisão de inteiros', esperado: 'matematica' },
    { msg: 'preciso aprender multiplicação', esperado: 'matematica' },
    { msg: 'o que é metade de 100?', esperado: 'matematica' },
    { msg: 'como somar frações com denominadores diferentes?', esperado: 'matematica' },
    { msg: 'geometria é difícil pra mim', esperado: 'matematica' },
    { msg: 'o que são números inteiros?', esperado: 'matematica' },
    { msg: 'não entendo adição de frações', esperado: 'matematica' },
    { msg: 'subtração de números negativos', esperado: 'matematica' },
    { msg: 'como resolver equação de primeiro grau?', esperado: 'matematica' },
    { msg: 'me ajuda com divisão de números decimais', esperado: 'matematica' },
    { msg: 'como funciona a tabuada do 7?', esperado: 'matematica' },
    { msg: 'o que é terço de 90?', esperado: 'matematica' },
    { msg: 'fração é mesmo que divisão?', esperado: 'matematica' },
    { msg: 'não sei calcular a área do triângulo', esperado: 'matematica' },
    { msg: 'como calcular o perímetro?', esperado: 'matematica' },
    { msg: 'o que é multiplicação de frações?', esperado: 'matematica' },
    { msg: 'me ensina geometria plana', esperado: 'matematica' },
    { msg: 'como resolver equação com 2 incógnitas?', esperado: 'matematica' },
    { msg: 'o que é número primo?', esperado: 'matematica' },
    { msg: '1/2 + 1/3 dá quanto?', esperado: 'matematica' },
    { msg: '2/3 de 120 é quanto?', esperado: 'matematica' },
    { msg: '3/4 multiplicado por 2', esperado: 'matematica' },
    { msg: 'o quarto de 40 é quanto?', esperado: 'matematica' },
    { msg: 'somar frações com denominadores iguais', esperado: 'matematica' },
    { msg: 'não entendo cálculo de porcentagem no desconto', esperado: 'matematica' },
  ])
})

describe('A — Português clara', () => {
  runCasos([
    { msg: 'o que é crase?', esperado: 'portugues' },
    { msg: 'me explica concordância verbal', esperado: 'portugues' },
    { msg: 'como usar vírgula?', esperado: 'portugues' },
    { msg: 'o que é sujeito e predicado?', esperado: 'portugues' },
    { msg: 'me ajuda com redação escolar', esperado: 'portugues' },
    { msg: 'o que é metáfora?', esperado: 'portugues' },
    { msg: 'como separar sílabas?', esperado: 'portugues' },
    { msg: 'o que são sinônimos?', esperado: 'portugues' },
    { msg: 'como usar o acento grave?', esperado: 'portugues' },
    { msg: 'o que é regência verbal?', esperado: 'portugues' },
    { msg: 'me explica figuras de linguagem', esperado: 'portugues' },
    { msg: 'o que é coerência textual?', esperado: 'portugues' },
    { msg: 'como fazer um parágrafo?', esperado: 'portugues' },
    { msg: 'o que é conjunção?', esperado: 'portugues' },
    { msg: 'me ajuda com ortografia', esperado: 'portugues' },
    { msg: 'o que é verbo transitivo?', esperado: 'portugues' },
    { msg: 'me explica pronome relativo', esperado: 'portugues' },
    { msg: 'como usar a crase corretamente?', esperado: 'portugues' },
    { msg: 'o que é texto argumentativo?', esperado: 'portugues' },
    { msg: 'me explica pontuação em redação', esperado: 'portugues' },
    { msg: 'o que é interpretação de texto?', esperado: 'portugues' },
    { msg: 'me fala sobre acentuação', esperado: 'portugues' },
    { msg: 'o que é substantivo?', esperado: 'portugues' },
    { msg: 'como identificar o adjetivo na frase?', esperado: 'portugues' },
    { msg: 'não entendo a diferença entre coesão e coerência', esperado: 'portugues' },
  ])
})

describe('A — História clara', () => {
  runCasos([
    { msg: 'me conta sobre a revolução francesa', esperado: 'historia' },
    { msg: 'o que foi a segunda guerra mundial?', esperado: 'historia' },
    { msg: 'me explica o feudalismo', esperado: 'historia' },
    { msg: 'como foi o descobrimento do Brasil?', esperado: 'historia' },
    { msg: 'o que é república?', esperado: 'historia' },
    { msg: 'me fala sobre o império romano', esperado: 'historia' },
    { msg: 'o que foi a ditadura militar no Brasil?', esperado: 'historia' },
    { msg: 'me conta sobre a escravidão no Brasil', esperado: 'historia' },
    { msg: 'o que foi a abolição da escravidão?', esperado: 'historia' },
    { msg: 'como surgiu a democracia antiga?', esperado: 'historia' },
    { msg: 'o que é renascimento histórico?', esperado: 'historia' },
    { msg: 'me conta sobre o iluminismo', esperado: 'historia' },
    { msg: 'o que foi a proclamação da república?', esperado: 'historia' },
    { msg: 'me explica a era Vargas', esperado: 'historia' },
    { msg: 'o que foi a revolução industrial?', esperado: 'historia' },
    { msg: 'me fala sobre o brasil colônia', esperado: 'historia' },
    { msg: 'me conta sobre a independência do Brasil', esperado: 'historia' },
    { msg: 'o que é monarquia?', esperado: 'historia' },
    { msg: 'me explica a colonização do Brasil', esperado: 'historia' },
    { msg: 'o que foi a primeira guerra mundial?', esperado: 'historia' },
    { msg: 'me conta sobre o egito antigo', esperado: 'historia' },
    { msg: 'o que é idade média?', esperado: 'historia' },
    { msg: 'me explica a civilização grega', esperado: 'historia' },
    { msg: 'o que foi a revolução industrial na Inglaterra?', esperado: 'historia' },
    { msg: 'me fala sobre a república romana', esperado: 'historia' },
  ])
})

describe('A — Ciências clara', () => {
  runCasos([
    { msg: 'como funciona a fotossíntese?', esperado: 'ciencias' },
    { msg: 'me explica o sistema digestivo', esperado: 'ciencias' },
    { msg: 'o que é uma célula?', esperado: 'ciencias' },
    { msg: 'como funciona o sistema respiratório?', esperado: 'ciencias' },
    { msg: 'o que é DNA?', esperado: 'ciencias' },
    { msg: 'me fala sobre ecossistema', esperado: 'ciencias' },
    { msg: 'como funciona a genética?', esperado: 'ciencias' },
    { msg: 'o que são vírus e bactérias?', esperado: 'ciencias' },
    { msg: 'me explica a teoria da evolução das espécies', esperado: 'ciencias' },
    { msg: 'como funciona o corpo humano?', esperado: 'ciencias' },
    { msg: 'o que é um órgão do corpo?', esperado: 'ciencias' },
    { msg: 'me fala sobre biologia celular', esperado: 'ciencias' },
    { msg: 'como as plantas fazem fotossíntese?', esperado: 'ciencias' },
    { msg: 'o que é microscópio?', esperado: 'ciencias' },
    { msg: 'me explica sobre saúde e doenças', esperado: 'ciencias' },
    { msg: 'como funciona o sistema imunológico?', esperado: 'ciencias' },
    { msg: 'o que é bactéria e como ela age?', esperado: 'ciencias' },
    { msg: 'me conta sobre a evolução das espécies', esperado: 'ciencias' },
    { msg: 'o que é animal invertebrado?', esperado: 'ciencias' },
    { msg: 'como a célula se reproduz?', esperado: 'ciencias' },
  ])
})

describe('A — Geografia clara', () => {
  runCasos([
    { msg: 'me fala sobre o mapa do Brasil', esperado: 'geografia' },
    { msg: 'o que é relevo montanhoso?', esperado: 'geografia' },
    { msg: 'como funciona o clima tropical?', esperado: 'geografia' },
    { msg: 'o que é bioma?', esperado: 'geografia' },
    { msg: 'me explica os continentes do mundo', esperado: 'geografia' },
    { msg: 'o que é latitude e longitude?', esperado: 'geografia' },
    { msg: 'me fala sobre o aquecimento global', esperado: 'geografia' },
    { msg: 'o que é desmatamento?', esperado: 'geografia' },
    { msg: 'me explica o fuso horário', esperado: 'geografia' },
    { msg: 'o que é a Amazônia?', esperado: 'geografia' },
    { msg: 'me fala sobre a rosa dos ventos', esperado: 'geografia' },
    { msg: 'o que é cartografia?', esperado: 'geografia' },
    { msg: 'me explica migração de população', esperado: 'geografia' },
    { msg: 'o que é o bioma cerrado?', esperado: 'geografia' },
    { msg: 'me fala sobre o pantanal', esperado: 'geografia' },
    { msg: 'o que é um hemisfério?', esperado: 'geografia' },
    { msg: 'me explica a mata atlântica', esperado: 'geografia' },
    { msg: 'o que é efeito estufa?', esperado: 'geografia' },
    { msg: 'me fala sobre a caatinga', esperado: 'geografia' },
    { msg: 'o que é planalto e planície?', esperado: 'geografia' },
  ])
})

describe('A — Física clara', () => {
  runCasos([
    { msg: 'me explica força e aceleração em física', esperado: 'fisica' },
    { msg: 'o que é velocidade em física?', esperado: 'fisica' },
    { msg: 'como funciona a lei de Newton?', esperado: 'fisica' },
    { msg: 'o que é eletricidade?', esperado: 'fisica' },
    { msg: 'me explica energia cinética e potencial', esperado: 'fisica' },
    { msg: 'o que é magnetismo?', esperado: 'fisica' },
    { msg: 'como funciona um circuito elétrico?', esperado: 'fisica' },
    { msg: 'o que é pressão em física?', esperado: 'fisica' },
    { msg: 'me explica resistência elétrica', esperado: 'fisica' },
    { msg: 'o que é torque em física?', esperado: 'fisica' },
    { msg: 'como funciona a termodinâmica?', esperado: 'fisica' },
    { msg: 'o que é comprimento de onda?', esperado: 'fisica' },
    { msg: 'me explica inércia de um objeto', esperado: 'fisica' },
    { msg: 'o que é entropia?', esperado: 'fisica' },
    { msg: 'como calcular o trabalho em física?', esperado: 'fisica' },
    { msg: 'o que é corrente elétrica?', esperado: 'fisica' },
    { msg: 'me explica aceleração e gravidade', esperado: 'fisica' },
    { msg: 'como funciona a eletricidade estática?', esperado: 'fisica' },
    { msg: 'o que é campo elétrico?', esperado: 'fisica' },
    { msg: 'me explica as leis de newton', esperado: 'fisica' },
  ])
})

describe('A — Química clara', () => {
  runCasos([
    { msg: 'me explica a tabela periódica', esperado: 'quimica' },
    { msg: 'o que é um átomo?', esperado: 'quimica' },
    { msg: 'como funciona uma reação química?', esperado: 'quimica' },
    { msg: 'o que é molécula?', esperado: 'quimica' },
    { msg: 'me fala sobre ácidos e bases na química', esperado: 'quimica' },
    { msg: 'o que é balanceamento de equações químicas?', esperado: 'quimica' },
    { msg: 'me explica ligação química', esperado: 'quimica' },
    { msg: 'o que é oxidação em química?', esperado: 'quimica' },
    { msg: 'como calcular o pH de uma solução?', esperado: 'quimica' },
    { msg: 'o que é química orgânica?', esperado: 'quimica' },
    { msg: 'me explica o que são elementos químicos', esperado: 'quimica' },
    { msg: 'como funciona a solução química?', esperado: 'quimica' },
    { msg: 'o que é molaridade?', esperado: 'quimica' },
    { msg: 'me explica reação de oxidação', esperado: 'quimica' },
    { msg: 'o que é elemento da tabela periódica?', esperado: 'quimica' },
  ])
})

describe('A — Inglês clara', () => {
  runCasos([
    { msg: 'me ajuda com inglês', esperado: 'ingles' },
    { msg: 'como usar present perfect em inglês?', esperado: 'ingles' },
    { msg: 'o que é simple past em inglês?', esperado: 'ingles' },
    { msg: 'me explica verb to be', esperado: 'ingles' },
    { msg: 'como falo em inglês?', esperado: 'ingles' },
    { msg: 'o que é present continuous?', esperado: 'ingles' },
    { msg: 'me ajuda com past perfect em inglês', esperado: 'ingles' },
    { msg: 'como usar modal verbs em inglês?', esperado: 'ingles' },
    { msg: 'como se diz em inglês borboleta?', esperado: 'ingles' },
    { msg: 'me explica simple present em inglês', esperado: 'ingles' },
    { msg: 'o que é phrasal verb?', esperado: 'ingles' },
    { msg: 'como traduzir essa frase para o inglês?', esperado: 'ingles' },
    { msg: 'em inglês como se fala boa tarde?', esperado: 'ingles' },
    { msg: 'me ajuda com gramática de inglês', esperado: 'ingles', desc: 'gramática + anti-keyword "de inglês" → ingles ✓' },
    { msg: 'o que é past continuous em inglês?', esperado: 'ingles' },
  ])
})

describe('A — Espanhol clara', () => {
  runCasos([
    { msg: 'me ajuda com espanhol', esperado: 'espanhol' },
    { msg: 'como se diz em espanhol borboleta?', esperado: 'espanhol' },
    { msg: 'hola como se dice mariposa?', esperado: 'espanhol' },
    { msg: 'me explica verbos em espanhol', esperado: 'espanhol' },
    { msg: 'como conjugar verbos en español?', esperado: 'espanhol' },
    { msg: 'como falar em espanhol?', esperado: 'espanhol' },
    { msg: 'traduzir para espanhol essa frase', esperado: 'espanhol' },
    { msg: 'me ajuda com conjugação espanhol', esperado: 'espanhol' },
    { msg: 'o que é subjuntivo em espanhol?', esperado: 'espanhol' },
    { msg: 'quero aprender espanhol', esperado: 'espanhol' },
  ])
})

// =============================================================================
// SEÇÃO B — FALSOS POSITIVOS POR SUBSTRING ← DEVEM FALHAR antes dos fixes
// =============================================================================
// 🔴 RED: Estes testes FALHAM com o código atual.
//         Após Fix 1 (word boundary), devem PASSAR.

describe('B — Falsos positivos SUBSTRING: "rio" em palavras comuns', () => {
  runCasos([
    { msg: 'o próprio 40 não seria certo', esperado: null, desc: 'rio em próprio' },
    { msg: 'o próprio aluno respondeu', esperado: null, desc: 'rio em próprio' },
    { msg: 'ela mesma, a própria professora', esperado: null, desc: 'rio em próprio' },
    { msg: 'ele ficou sério durante a aula', esperado: null, desc: 'rio em sério' },
    { msg: 'estava bem sério quando explicou', esperado: null, desc: 'rio em sério' },
    { msg: 'o contrário seria mais simples', esperado: null, desc: 'rio em contrário' },
    { msg: 'pelo contrário, entendi tudo', esperado: null, desc: 'rio em contrário' },
    { msg: 'escrevi no meu diário hoje', esperado: null, desc: 'rio em diário' },
    { msg: 'meu diário de estudo está cheio', esperado: null, desc: 'rio em diário' },
    { msg: 'os resultados anteriores estavam certos', esperado: null, desc: 'rio em anteriores' },
    { msg: 'as respostas anteriores faziam sentido', esperado: null, desc: 'rio em anteriores' },
    { msg: 'valores superiores a 100', esperado: null, desc: 'rio em superiores' },
    { msg: 'números inferiores a zero', esperado: 'matematica', desc: 'rio em inferiores — mas tem "números" = mat ✓' },
    { msg: 'o território brasileiro é enorme', esperado: 'geografia', desc: 'território = keyword geo real ✓' },
    { msg: 'o Mario me ajudou com isso', esperado: null, desc: 'rio em Mario' },
    { msg: 'o cenário foi bonito', esperado: null, desc: 'rio em cenário' },
    { msg: 'isso é um critério importante', esperado: null, desc: 'rio em critério' },
    { msg: 'não é obrigatório fazer isso', esperado: null, desc: 'rio em obrigatório' },
    { msg: 'o noticiário falou sobre isso', esperado: null, desc: 'rio em noticiário' },
    { msg: 'o armário da sala estava aberto', esperado: null, desc: 'rio em armário' },
  ])
})

describe('B — Falsos positivos SUBSTRING: "pais" em palavras comuns', () => {
  runCasos([
    { msg: 'que paisagem bonita essa foto', esperado: null, desc: 'pais em paisagem (social)' },
  ])
})

describe('B — Falsos positivos SUBSTRING: "base" em palavras comuns', () => {
  runCasos([
    { msg: 'baseado no que você disse antes', esperado: null, desc: 'base em baseado' },
    { msg: 'isso é baseado em fatos reais', esperado: null, desc: 'base em baseado' },
    { msg: 'a proposta está baseada em estudos', esperado: null, desc: 'base em baseada' },
  ])
})

// =============================================================================
// SEÇÃO C — FALSOS POSITIVOS SEMÂNTICOS ← DEVEM FALHAR antes dos fixes
// =============================================================================
// 🔴 RED: Estes testes FALHAM com o código atual.
//         Após Fix 2 (remover ' mais ', ' menos '), devem PASSAR.

describe('C — Falsos positivos SEMÂNTICOS: " mais " e " menos " cotidianos', () => {
  runCasos([
    { msg: 'ficou muito mais fácil entender', esperado: null, desc: 'mais fácil = social' },
    { msg: 'agora está mais claro pra mim', esperado: null, desc: 'mais claro = social' },
    { msg: 'muito mais simples do que eu pensava', esperado: null, desc: 'mais simples = social' },
    { msg: 'está cada vez mais difícil', esperado: null, desc: 'mais difícil = social' },
    { msg: 'preciso de mais tempo para pensar', esperado: null, desc: 'mais tempo = social' },
    { msg: 'quero estudar mais hoje', esperado: null, desc: 'estudar mais = social' },
    { msg: 'pode repetir mais devagar?', esperado: null, desc: 'mais devagar = continuidade' },
    { msg: 'ficou menos complicado agora', esperado: null, desc: 'menos complicado = social' },
    { msg: 'foi menos difícil do que pensei', esperado: null, desc: 'menos difícil = social' },
    { msg: 'me sinto cada vez menos perdida', esperado: null, desc: 'menos perdida = social' },
    { msg: 'antes era muito mais confuso', esperado: null, desc: 'mais confuso = social' },
    { msg: 'você explica muito mais bem que meu professor', esperado: null, desc: 'mais bem = social' },
    { msg: 'isso faz muito mais sentido agora', esperado: null, desc: 'mais sentido = social' },
    { msg: 'a aula de hoje foi muito mais boa', esperado: null, desc: 'mais boa = social' },
    { msg: 'preciso de mais exemplos por favor', esperado: null, desc: 'mais exemplos = continuidade' },
  ])
})

describe('C — Falsos positivos SEMÂNTICOS: "vezes" no sentido de "às vezes"', () => {
  runCasos([
    { msg: 'às vezes não consigo entender', esperado: null, desc: 'às vezes = às vezes' },
    { msg: 'as vezes fico confusa com isso', esperado: null, desc: 'as vezes = às vezes' },
    { msg: 'às vezes a explicação complica mais', esperado: null, desc: 'às vezes = às vezes' },
    { msg: 'umas vezes entendo outras não', esperado: null, desc: 'umas vezes = social' },
  ])
})

describe('C — Falsos positivos SEMÂNTICOS: palavras de física em contexto cotidiano', () => {
  runCasos([
    { msg: 'que energia boa essa professora tem', esperado: null, desc: 'energia = entusiasmo' },
    { msg: 'a turma tinha muita energia hoje', esperado: null, desc: 'energia = entusiasmo' },
    { msg: 'ela tem muita força de vontade', esperado: null, desc: 'força = vontade' },
    { msg: 'que calor faz hoje na sala', esperado: null, desc: 'calor = temperatura ambiente' },
    { msg: 'o calor humano da professora é incrível', esperado: null, desc: 'calor = afeição' },
    { msg: 'o movimento de dança foi lindo', esperado: null, desc: 'movimento = dança' },
    { msg: 'o movimento estudantil é importante', esperado: null, desc: 'movimento = social' },
    { msg: 'a temperatura da sopa está ótima', esperado: null, desc: 'temperatura = culinária' },
  ])
})

// =============================================================================
// SEÇÃO D — MENSAGENS SOCIAIS/EMOCIONAIS (devem retornar null)
// =============================================================================
// Estas devem retornar null INDEPENDENTE do herói ativo.
// A maioria já passa no código atual — são incluídas como regressão.

describe('D — Mensagens sociais e emocionais', () => {
  runCasos([
    { msg: 'hahahaha entendi agora!', esperado: null },
    { msg: 'nossa que difícil esse assunto', esperado: null },
    { msg: 'obrigada você explicou muito bem', esperado: null },
    { msg: 'antes era grego para mim', esperado: null },
    { msg: 'agora ficou mais claro obrigada', esperado: null },
    { msg: 'kkkkkk finalmente entendi', esperado: null },
    { msg: 'não entendi nada ainda', esperado: null },
    { msg: 'pode repetir de outro jeito?', esperado: null },
    { msg: 'nossa não sei... o próprio 40', esperado: null },
    { msg: 'oi tudo bem?', esperado: null },
    { msg: 'que legal essa explicação!', esperado: null },
    { msg: 'nossa eu sou muito burra', esperado: null },
    { msg: 'caramba agora fez sentido', esperado: null },
    { msg: 'ok entendi, obrigada!', esperado: null },
    { msg: 'hm deixa eu pensar...', esperado: null },
    { msg: 'quando meu pai explicou não entendi nada', esperado: null },
    { msg: 'agora que você explicou ficou muito mais fácil', esperado: null },
    { msg: 'antes era grego pra mim, agora entendo', esperado: null },
    { msg: 'ufa que alívio finalmente entendi', esperado: null },
    { msg: 'não tô conseguindo, pode ajudar?', esperado: null },
    { msg: 'esse assunto é chato demais', esperado: null },
    { msg: 'me ajuda por favor', esperado: null },
    { msg: 'ok pode continuar', esperado: null },
    { msg: 'ah entendi!', esperado: null },
    { msg: 'não faço ideia do que você disse', esperado: null },
    { msg: 'posso fazer uma pergunta?', esperado: null },
    { msg: 'como assim?', esperado: null },
    { msg: 'repete isso por favor', esperado: null },
    { msg: 'você é muito boa professora', esperado: null },
    { msg: 'isso foi incrível, aprendi muito', esperado: null },
  ])
})

// =============================================================================
// SEÇÃO E — TROCAS EXPLÍCITAS DE MATÉRIA (devem detectar a nova matéria)
// =============================================================================

describe('E — Trocas explícitas de matéria', () => {
  runCasos([
    { msg: 'agora me ajuda com matemática por favor', esperado: 'matematica' },
    { msg: 'posso perguntar sobre história?', esperado: 'historia' },
    { msg: 'quero falar de ciências agora', esperado: 'ciencias' },
    { msg: 'mudando de assunto: tenho dúvida de física', esperado: 'fisica' },
    { msg: 'outra coisa: me explica química', esperado: 'quimica' },
    { msg: 'agora quero saber sobre o descobrimento do Brasil', esperado: 'historia' },
    { msg: 'esquece isso, me ajuda com fração', esperado: 'matematica' },
    { msg: 'tenho uma dúvida de inglês também', esperado: 'ingles' },
    { msg: 'posso perguntar sobre espanhol?', esperado: 'espanhol' },
    { msg: 'preciso entender equação agora', esperado: 'matematica' },
  ])
})

// =============================================================================
// SEÇÃO F — CASOS AMBÍGUOS COM PALAVRAS-CHAVE EM CONTEXTO ERRADO
// =============================================================================
// Palavras-chave reais em frases que NÃO são sobre aquela matéria.
// Alguns retornam null (errado semânticamente) — documentam comportamento.

describe('F — Palavras-chave em contexto não-escolar', () => {
  runCasos([
    // 'trabalho de ciências/história' → detecta a matéria do trabalho (correto)
    { msg: 'trabalho de ciências para entregar amanhã', esperado: 'ciencias', desc: 'ciências detecta antes do trabalho de física' },
    { msg: 'trabalho de história para a semana', esperado: 'historia', desc: 'história detecta normalmente' },
    { msg: 'trabalho de casa para fazer', esperado: null, desc: 'trabalho de casa = anti-keyword' },
    // 'rio' como substantivo real deve detectar geografia
    { msg: 'o rio Amazonas é o maior do mundo', esperado: 'geografia', desc: 'rio sozinho = geo ✓' },
    { msg: 'qual rio passa pelo Pantanal?', esperado: 'geografia', desc: 'rio + pantanal = geo ✓' },
    // 'país' / 'pais' real deve detectar geografia
    { msg: 'qual é a capital desse país?', esperado: 'geografia', desc: 'país = geo ✓' },
    // 'base' em química isolada deve detectar
    { msg: 'a diferença entre ácido e base em química', esperado: 'quimica', desc: 'ácido e base = quim ✓' },
    // Números/operações matemáticas reais
    { msg: 'quanto é 2 + 3?', esperado: 'matematica', desc: 'operação + = mat ✓' },
    { msg: 'x = 5, como resolver?', esperado: 'matematica', desc: 'x = equação = mat ✓' },
  ])
})

// =============================================================================
// SEÇÃO G — VARIAÇÕES E CASES EDGE
// =============================================================================

describe('G — Variações com maiúsculas e acentos', () => {
  runCasos([
    { msg: 'MATEMÁTICA é minha matéria favorita', esperado: 'matematica' },
    { msg: 'Português é difícil', esperado: 'portugues' },
    { msg: 'HISTÓRIA do Brasil', esperado: 'historia' },
    { msg: 'FÍSICA quântica', esperado: 'fisica' },
    { msg: 'QUIMICA orgânica', esperado: 'quimica' },
    { msg: 'GEOGRAFIA do mundo', esperado: 'geografia' },
    { msg: 'ingles avancado', esperado: 'ingles' },
    { msg: 'ESPANHOL do zero', esperado: 'espanhol' },
    // Sem acento
    { msg: 'fracao matematica', esperado: 'matematica' },
    { msg: 'equacao de primeiro grau', esperado: 'matematica' },
    { msg: 'revolucao francesa', esperado: 'historia' },
    { msg: 'fotossintese das plantas', esperado: 'ciencias' },
  ])
})

describe('G — Mensagens curtíssimas e emojis', () => {
  runCasos([
    { msg: '???', esperado: null },
    { msg: '😊', esperado: null },
    { msg: '!', esperado: null },
    { msg: 'ok', esperado: null },
    { msg: 'sim', esperado: null },
    { msg: 'não', esperado: null },
    { msg: 'oi', esperado: null },
    { msg: 'hm', esperado: null },
    { msg: '...', esperado: null },
    { msg: 'entendi', esperado: null },
    { msg: 'não sei', esperado: null },
    { msg: 'ajuda', esperado: null },
  ])
})

describe('G — Frases que contêm múltiplas matérias (deve pegar a primeira na ordem)', () => {
  runCasos([
    // Matemática vem antes de física na ordem de verificação
    { msg: 'equação de movimento na física', esperado: 'matematica', desc: 'equação (mat) antes de movimento (fis)' },
    // História vem antes de ciências
    { msg: 'evolução histórica das guerras', esperado: 'historia', desc: 'guerra (hist) antes de evolução (cien)' },
  ])
})
