/**
 * Teste manual de regressão — detectarTema()
 * ─────────────────────────────────────────────────────────────────────────────
 * NÃO é um teste Jest. Serve como documentação viva de casos críticos.
 *
 * Executar com:
 *   npx ts-node --esm src/core/router.test.manual.ts
 *
 * Atualizado em: 2026-04-13 (Universal Method — correção falsos positivos CALCULUS)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { detectarTema } from './router.js'

interface CasoTeste {
  input: string
  esperado: string | null
  desc: string
}

const casos: CasoTeste[] = [
  // ─── FALSOS POSITIVOS CALCULUS — devem retornar null ───────────────────────
  { input: '- ele entendeu o conceito', esperado: null, desc: 'traço antes de frase (marcador de lista)' },
  { input: '- preciso estudar verbo', esperado: 'portugues', desc: 'traço + keyword português = português, não matemática' },
  { input: 'nessa área estudamos muito', esperado: null, desc: 'área não-matemática (contexto vago)' },
  { input: 'minha área de estudo é biologia', esperado: 'ciencias', desc: 'área + biologia = ciências, não matemática' },
  { input: 'qual o número de páginas do livro', esperado: null, desc: 'número de páginas (não matemática)' },
  { input: 'metade do texto fala sobre verbos', esperado: 'portugues', desc: 'metade + verbos = português, não matemática' },
  { input: 'metade da aula de hoje foi sobre história', esperado: 'historia', desc: 'metade da aula + história = história' },
  { input: 'três vezes ao dia tomo o remédio', esperado: null, desc: 'vezes de frequência cotidiana (não matemática)' },
  { input: 'quantas vezes eu errei essa conta', esperado: 'matematica', desc: 'quantas vezes + conta = matemática' },
  { input: 'muitas vezes o professor explicou isso', esperado: null, desc: 'muitas vezes = anti-keyword (frequência)' },
  { input: 'bom + barato compro tudo', esperado: null, desc: '+ isolado em contexto coloquial (removido das keywords)' },

  // ─── VERDADEIROS POSITIVOS CALCULUS — devem retornar matematica ────────────
  { input: 'preciso de ajuda com frações', esperado: 'matematica', desc: 'fração explícita' },
  { input: 'qual é a área do triângulo retângulo', esperado: 'matematica', desc: 'área geométrica com triângulo' },
  { input: 'como faço 1/2 + 1/3', esperado: 'matematica', desc: 'soma de frações (operação explícita)' },
  { input: 'o número primo mais próximo de 10', esperado: 'matematica', desc: 'número primo' },
  { input: 'preciso calcular o perímetro', esperado: 'matematica', desc: 'perímetro geométrico' },
  { input: 'vou resolver equação de 2º grau', esperado: 'matematica', desc: 'equação de 2º grau' },
  { input: 'como calcular porcentagem', esperado: 'matematica', desc: 'porcentagem' },
  { input: 'divisão de 150 por 6', esperado: 'matematica', desc: 'divisão explícita' },

  // ─── VERDADEIROS POSITIVOS PORTUGUÊS ────────────────────────────────────────
  { input: 'vou estudar crase e concordância', esperado: 'portugues', desc: 'português direto' },
  { input: 'me ajuda com o texto', esperado: 'portugues', desc: 'texto → português' },
  { input: 'qual a diferença entre metáfora e comparação', esperado: 'portugues', desc: 'figuras de linguagem' },
  { input: 'como usar vírgula em oração', esperado: 'portugues', desc: 'vírgula + oração → português' },

  // ─── COLISÕES RESOLVIDAS ────────────────────────────────────────────────────
  { input: 'escrever uma história criativa', esperado: null, desc: 'história criativa = anti-keyword HISTORIA (narrativa, não matéria)' },
  { input: 'segunda guerra mundial impactos', esperado: 'historia', desc: 'segunda guerra = história' },
  { input: 'velocidade de uma bola', esperado: 'fisica', desc: 'velocidade → física' },
  { input: 'temperatura da reação química', esperado: 'quimica', desc: 'reação química prevalece sobre física' },
]

let passed = 0
let failed = 0

console.log('🧪 Teste de regressão — detectarTema()\n')

for (const caso of casos) {
  const resultado = detectarTema(caso.input)
  const ok = resultado === caso.esperado
  if (ok) {
    passed++
    console.log(`✅ ${caso.desc}`)
  } else {
    failed++
    console.log(`❌ ${caso.desc}`)
    console.log(`   input:    "${caso.input}"`)
    console.log(`   esperado: ${caso.esperado ?? 'null'}`)
    console.log(`   obtido:   ${resultado ?? 'null'}`)
  }
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`Resultado: ${passed}/${casos.length} passaram ${failed > 0 ? `(${failed} falharam)` : '✅'}`)

if (failed > 0) {
  process.exit(1)
}
