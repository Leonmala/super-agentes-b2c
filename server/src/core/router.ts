// Roteamento de personas — tradução do GESTOR.md para código
// Expande para 8 matérias + FLEX (inglês/espanhol)

import type { Sessao, Turno } from '../db/supabase.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '')

// Keywords por tema — conservadores para evitar falsos positivos
const KEYWORDS_MATEMATICA = [
  'matemática', 'matematica', 'conta de matematica', 'conta de matemática',
  'fazer conta', 'fazer contas', 'contas de',
  'fração', 'fracao', 'fracoes', 'frações',
  'número', 'numero', 'números', 'numeros',
  'somar', 'soma', 'dividir', 'divisão', 'divisao',
  'multiplicar', 'multiplicação', 'multiplicacao',
  'vezes', 'subtração', 'subtracao', 'adição', 'adicao',
  'calculo', 'cálculo', 'equação', 'equacao',
  'porcentagem', 'geometria', 'tabuada',
  '/2', '/3', '/4', '/5', '/6', '/8', '/10',
  '1/2', '1/3', '1/4', '1/5', '1/6', '1/8',
  '2/3', '3/4', '2/5', '3/5', '4/5',
  'metade', 'terço', 'terco', 'quarto',
  '+', '-', '=', 'x ', ' vezes ', ' mais ', ' menos ',
  'soma', 'subtrai', 'divide', 'multiplica'
]

const KEYWORDS_PORTUGUES = [
  'português', 'portugues', 'redação', 'redacao',
  'texto', 'gramática', 'gramatica',
  'sílaba', 'silaba', 'sílabas', 'silabas',
  'vírgula', 'virgula', 'leitura', 'escrita',
  'ortografia', 'pontuação', 'pontuacao',
  'crase', 'concordância', 'concordancia',
  'regencia', 'regência',
  'interpretação', 'interpretacao',
  'parágrafo', 'paragrafo',
  'acentuação', 'acentuacao',
  'verbo', 'substantivo', 'adjetivo', 'pronome',
  'metáfora', 'metafora', 'comparação', 'comparacao',
  'figura de linguagem', 'figuras de linguagem',
  'sinônimo', 'sinonimo', 'antônimo', 'antonimo',
  'coesão', 'coesao', 'coerência', 'coerencia',
  'oração', 'oracao', 'sujeito', 'predicado',
  'conjunção', 'conjuncao', 'preposição', 'preposicao'
]

const KEYWORDS_CIENCIAS = [
  'ciências', 'ciencias', 'biologia', 'corpo humano',
  'célula', 'celula', 'ecossistema', 'fotossíntese', 'fotossintese',
  'animal', 'planta', 'saúde', 'saude', 'doença', 'doenca',
  'órgão', 'orgao', 'sistema digestivo', 'sistema respiratório', 'sistema respiratorio',
  'teoria da evolução', 'teoria da evolucao', 'evolução das espécies', 'evolucao das especies',
  'dna', 'genética', 'genetica',
  'vírus', 'virus', 'bactéria', 'bacteria', 'microscópio', 'microscopio'
]

const KEYWORDS_HISTORIA = [
  'história', 'historia', 'guerra', 'revolução', 'revolucao',
  'revolução francesa', 'revolucao francesa',
  'brasil colônia', 'brasil colonia', 'império', 'imperio',
  'república', 'republica', 'medieval', 'renascimento',
  'segunda guerra', 'primeira guerra', 'independência', 'independencia',
  'ditadura', 'democracia', 'egito', 'roma', 'grécia', 'grecia',
  'escravidão', 'escravidao', 'abolição', 'abolicao',
  'descobrimento', 'colonização', 'colonizacao',
  'monarquia', 'feudalismo', 'iluminismo',
  'civilização', 'civilizacao', 'idade média', 'idade media',
  'revolução industrial', 'revolucao industrial',
  'era vargas', 'proclamação', 'proclamacao'
]

const KEYWORDS_GEOGRAFIA = [
  'geografia', 'mapa', 'relevo', 'clima', 'bioma',
  'continente', 'país', 'pais', 'capital', 'rio', 'montanha',
  'oceano', 'floresta', 'amazônia', 'amazonia',
  'população', 'populacao', 'urbanização', 'urbanizacao',
  'latitude', 'longitude', 'fuso horário', 'fuso horario',
  'aquecimento global', 'efeito estufa', 'desmatamento',
  'poluição', 'poluicao', 'sustentabilidade',
  'região', 'regiao', 'território', 'territorio',
  'fronteira', 'migração', 'migracao', 'globalização', 'globalizacao',
  'cartografia', 'escala', 'rosa dos ventos', 'hemisferio', 'hemisfério',
  'planalto', 'planície', 'planicie', 'litoral', 'sertão', 'sertao',
  'cerrado', 'caatinga', 'pampa', 'pantanal', 'mata atlântica', 'mata atlantica'
]

const KEYWORDS_FISICA = [
  'física', 'fisica', 'força', 'forca', 'velocidade',
  'aceleração', 'aceleracao', 'energia', 'newton', 'gravidade',
  'eletricidade', 'magnetismo', 'onda', 'calor', 'temperatura',
  'pressão', 'pressao', 'movimento', 'inércia', 'inercia',
  'potência', 'potencia',
  'leis de newton', 'lei de newton', 'atrito', 'trabalho',
  'impulso', 'momento', 'torque', 'campo elétrico', 'campo eletrico',
  'circuito', 'resistência', 'resistencia', 'corrente elétrica', 'corrente eletrica',
  'frequência', 'frequencia', 'comprimento de onda',
  'termodinâmica', 'termodinamica', 'entropia'
]

// ─── Anti-Keywords (Blocklist) ──────────────────────────────────────────────
// Se a mensagem contém uma keyword que ativa um tema, MAS TAMBÉM contém
// uma anti-keyword desse tema, o match é CANCELADO.
// Extensível: conforme testes reais revelam colisões, basta adicionar aqui.
// ────────────────────────────────────────────────────────────────────────────

const ANTI_KEYWORDS_MATEMATICA: string[] = []
const ANTI_KEYWORDS_PORTUGUES: string[] = []
const ANTI_KEYWORDS_HISTORIA: string[] = []
const ANTI_KEYWORDS_CIENCIAS: string[] = []
const ANTI_KEYWORDS_GEOGRAFIA: string[] = []

const ANTI_KEYWORDS_FISICA = [
  // "trabalho" em contexto escolar = lição de casa, não conceito físico
  'trabalho de ciências', 'trabalho de ciencias',
  'trabalho de história', 'trabalho de historia',
  'trabalho de português', 'trabalho de portugues',
  'trabalho de geografia',
  'trabalho de química', 'trabalho de quimica',
  'trabalho de inglês', 'trabalho de ingles',
  'trabalho de espanhol',
  'trabalho de biologia',
  'trabalho de casa', 'trabalho escolar', 'trabalho da escola',
  'trabalho de matemática', 'trabalho de matematica',
]

const ANTI_KEYWORDS_QUIMICA: string[] = []
const ANTI_KEYWORDS_INGLES: string[] = []
const ANTI_KEYWORDS_ESPANHOL: string[] = []

const KEYWORDS_QUIMICA = [
  'química', 'quimica', 'átomo', 'atomo', 'molécula', 'molecula',
  'elemento', 'tabela periódica', 'tabela periodica',
  'reação', 'reacao', 'ácido', 'acido', 'base', 'ph',
  'ligação', 'ligacao', 'oxidação', 'oxidacao',
  'balanceamento', 'molar', 'solução', 'solucao'
]

const KEYWORDS_INGLES = [
  'inglês', 'ingles', 'english', 'verb to be', 'present tense',
  'past tense', 'future', 'vocabulary', 'grammar', 'reading',
  'writing english', 'tradução inglês', 'traducao ingles',
  'traduzir para inglês', 'como fala em inglês', 'como se diz em inglês',
  'what is', 'how to say',
  'present perfect', 'past perfect', 'simple past', 'simple present',
  'present continuous', 'past continuous', 'future perfect',
  'conditional', 'modal verb', 'phrasal verb',
  'preposition', 'adjective', 'adverb',
  'singular', 'plural', 'countable', 'uncountable',
  'do you', 'did you', 'will you', 'can you',
  'in english', 'em inglês', 'em ingles'
]

const KEYWORDS_ESPANHOL = [
  'espanhol', 'español', 'spanish', 'hola',
  'verbos em espanhol', 'conjugação espanhol', 'conjugacao espanhol',
  'como fala em espanhol', 'traduzir para espanhol',
  'como se diz em espanhol'
]

// Palavras que indicam continuidade (não precisa de PSICO)
const KEYWORDS_CONTINUIDADE = [
  'não entendi', 'nao entendi',
  'pode explicar de novo', 'explica de novo',
  'não ficou claro', 'nao ficou claro',
  'de outro jeito', 'outra forma',
  'não compreendi', 'nao compreendi',
  'repita', 'de novo'
]

// Normaliza removendo acentos para comparação robusta
function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function detectarTema(mensagem: string): string | null {
  const msg = mensagem.toLowerCase()
  const msgSemAcento = removerAcentos(msg)

  // Checar com e sem acentos para robustez de encoding
  const temKeyword = (keywords: string[]) =>
    keywords.some(k => msg.includes(k) || msgSemAcento.includes(removerAcentos(k)))

  // Match com bloqueio: keyword ativa o tema, anti-keyword cancela
  const matchKeyword = (keywords: string[], antiKeywords: string[]) => {
    if (!temKeyword(keywords)) return false
    // Se há anti-keywords presentes, o match é cancelado
    if (antiKeywords.length > 0 && temKeyword(antiKeywords)) return false
    return true
  }

  // ORDEM IMPORTA: historia antes de ciencias (evita "revolução" → "evolução" falso positivo)
  if (matchKeyword(KEYWORDS_MATEMATICA, ANTI_KEYWORDS_MATEMATICA)) return 'matematica'
  if (matchKeyword(KEYWORDS_PORTUGUES, ANTI_KEYWORDS_PORTUGUES)) return 'portugues'
  if (matchKeyword(KEYWORDS_HISTORIA, ANTI_KEYWORDS_HISTORIA)) return 'historia'
  if (matchKeyword(KEYWORDS_CIENCIAS, ANTI_KEYWORDS_CIENCIAS)) return 'ciencias'
  if (matchKeyword(KEYWORDS_GEOGRAFIA, ANTI_KEYWORDS_GEOGRAFIA)) return 'geografia'
  if (matchKeyword(KEYWORDS_FISICA, ANTI_KEYWORDS_FISICA)) return 'fisica'
  if (matchKeyword(KEYWORDS_QUIMICA, ANTI_KEYWORDS_QUIMICA)) return 'quimica'
  if (matchKeyword(KEYWORDS_ESPANHOL, ANTI_KEYWORDS_ESPANHOL)) return 'espanhol'
  if (matchKeyword(KEYWORDS_INGLES, ANTI_KEYWORDS_INGLES)) return 'ingles'

  return null
}

export function detectarContinuidade(mensagem: string): boolean {
  const msg = mensagem.toLowerCase()
  return KEYWORDS_CONTINUIDADE.some(k => msg.includes(k))
}

// Classificador inteligente usando LLM (Gemini Flash, <1s)
export async function classificarTemaInteligente(mensagem: string): Promise<{
  categoria: 'matematica' | 'portugues' | 'ciencias' | 'historia' | 'geografia' | 'fisica' | 'quimica' | 'ingles' | 'espanhol' | 'continuidade' | 'ambiguo';
  confianca: number;
}> {
  if (!GOOGLE_API_KEY) {
    return { categoria: 'ambiguo', confianca: 0 }
  }

  const prompt = `Analise a mensagem do aluno e classifique em UMA categoria:

CATEGORIAS:
- "matematica" - números, contas, frações, geometria, operações matemáticas
- "portugues" - gramática, crase, pontuação, redação, ortografia
- "ciencias" - biologia, corpo humano, célula, ecossistema, saúde, evolução
- "historia" - eventos históricos, datas, revoluções, períodos
- "geografia" - mapa, relevo, clima, continentes, paisagens
- "fisica" - força, velocidade, energia, movimento
- "quimica" - átomos, moléculas, reações, tabela periódica
- "ingles" - vocabulário inglês, tradução, frases em inglês
- "espanhol" - vocabulário espanhol, tradução, frases em espanhol
- "continuidade" - pedido para repetir, explicar de novo, não entendeu
- "ambiguo" - não dá para saber o tema ou é conversa casual

Responda APENAS com o formato: CATEGORIA|CONFIANCA
Exemplo: matematica|95

Mensagem: "${mensagem}"
Categoria:`

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 20,
      }
    })

    const result = await model.generateContent(prompt)
    const resposta = result.response.text().trim()

    const [categoriaStr, confiancaStr] = resposta.split('|')
    const categoria = categoriaStr?.toLowerCase().trim() as any
    const confianca = parseInt(confiancaStr) || 50

    const categoriasValidas = ['matematica', 'portugues', 'ciencias', 'historia', 'geografia', 'fisica', 'quimica', 'ingles', 'espanhol', 'continuidade', 'ambiguo']
    if (categoriasValidas.includes(categoria)) {
      return { categoria, confianca }
    }

    return { categoria: 'ambiguo', confianca: 0 }
  } catch (error) {
    console.error('[Router Inteligente] Erro ao classificar:', error)
    return { categoria: 'ambiguo', confianca: 0 }
  }
}

export function personaPorTema(tema: string): string {
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
  return mapa[tema] || 'PSICOPEDAGOGICO'
}

export function decidirPersona(
  mensagem: string,
  sessao: Sessao,
  ultimosTurnos: Turno[]
): string {
  const temaDetectado = detectarTema(mensagem)

  // Sem tema claro → verificar se já está numa conversa ativa com um herói
  if (!temaDetectado) {
    // Se já está com um herói ativo, manter o herói (continuidade)
    if (sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      return sessao.agente_atual
    }
    // Sem contexto → PSICOPEDAGOGICO qualifica
    return 'PSICOPEDAGOGICO'
  }

  // Troca de matéria → verificar histórico recente
  if (temaDetectado !== sessao.tema_atual) {
    const personaAlvo = personaPorTema(temaDetectado)
    const jaAtendido = ultimosTurnos.some(t => t.agente === personaAlvo)

    // Primeira vez nessa matéria → PSICOPEDAGOGICO qualifica
    if (!jaAtendido) return 'PSICOPEDAGOGICO'
  }

  // Matéria clara e já atendida (ou continuidade) → persona direta
  return personaPorTema(temaDetectado)
}

export function determinarStatus(
  mensagem: string,
  persona: string,
  sessao: Sessao
): Turno['status'] {
  const msg = mensagem.toLowerCase()
  const temaDetectado = detectarTema(mensagem)

  // Detectar pausa/intenção de sair
  const KEYWORDS_PAUSA = [
    'sair', 'tenho que ir', 'minha mãe', 'minha mae',
    'até mais', 'ate mais', 'tchau', 'até logo', 'ate logo',
    'depois', 'preciso ir', 'vou sair'
  ]
  if (KEYWORDS_PAUSA.some(k => msg.includes(k))) {
    return 'PAUSA'
  }

  // Troca de tema detectada
  if (temaDetectado && temaDetectado !== sessao.tema_atual) {
    return 'TROCA_TEMA'
  }

  // Continuidade normal
  return 'CONTINUIDADE'
}
