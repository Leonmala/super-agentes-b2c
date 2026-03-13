// Roteamento de personas — tradução do GESTOR.md para código
// Expande para 8 matérias + FLEX (inglês/espanhol)

import type { Sessao, Turno } from '../db/supabase.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '')

// Keywords por tema — conservadores para evitar falsos positivos
const KEYWORDS_MATEMATICA = [
  'matemática', 'matematica', 'conta', 'contas',
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
  'verbo', 'substantivo', 'adjetivo', 'pronome'
]

const KEYWORDS_CIENCIAS = [
  'ciências', 'ciencias', 'biologia', 'corpo humano',
  'célula', 'celula', 'ecossistema', 'fotossíntese', 'fotossintese',
  'animal', 'planta', 'saúde', 'saude', 'doença', 'doenca',
  'órgão', 'orgao', 'sistema digestivo', 'sistema respiratório', 'sistema respiratorio',
  'evolução', 'evolucao', 'dna', 'genética', 'genetica',
  'vírus', 'virus', 'bactéria', 'bacteria', 'microscópio', 'microscopio'
]

const KEYWORDS_HISTORIA = [
  'história', 'historia', 'guerra', 'revolução', 'revolucao',
  'brasil colônia', 'brasil colonia', 'império', 'imperio',
  'república', 'republica', 'medieval', 'renascimento',
  'segunda guerra', 'primeira guerra', 'independência', 'independencia',
  'ditadura', 'democracia', 'egito', 'roma', 'grécia', 'grecia',
  'escravidão', 'escravidao', 'abolição', 'abolicao'
]

const KEYWORDS_GEOGRAFIA = [
  'geografia', 'mapa', 'relevo', 'clima', 'bioma',
  'continente', 'país', 'pais', 'capital', 'rio', 'montanha',
  'oceano', 'floresta', 'amazônia', 'amazonia',
  'população', 'populacao', 'urbanização', 'urbanizacao',
  'latitude', 'longitude', 'fuso horário', 'fuso horario'
]

const KEYWORDS_FISICA = [
  'física', 'fisica', 'força', 'forca', 'velocidade',
  'aceleração', 'aceleracao', 'energia', 'newton', 'gravidade',
  'eletricidade', 'magnetismo', 'onda', 'calor', 'temperatura',
  'pressão', 'pressao', 'movimento', 'inércia', 'inercia',
  'potência', 'potencia'
]

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
  'what is', 'how to say'
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

export function detectarTema(mensagem: string): string | null {
  const msg = mensagem.toLowerCase()

  if (KEYWORDS_MATEMATICA.some(k => msg.includes(k))) return 'matematica'
  if (KEYWORDS_PORTUGUES.some(k => msg.includes(k))) return 'portugues'
  if (KEYWORDS_CIENCIAS.some(k => msg.includes(k))) return 'ciencias'
  if (KEYWORDS_HISTORIA.some(k => msg.includes(k))) return 'historia'
  if (KEYWORDS_GEOGRAFIA.some(k => msg.includes(k))) return 'geografia'
  if (KEYWORDS_FISICA.some(k => msg.includes(k))) return 'fisica'
  if (KEYWORDS_QUIMICA.some(k => msg.includes(k))) return 'quimica'
  if (KEYWORDS_ESPANHOL.some(k => msg.includes(k))) return 'espanhol'
  if (KEYWORDS_INGLES.some(k => msg.includes(k))) return 'ingles'

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
