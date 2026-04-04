// Roteamento de personas — tradução do GESTOR.md para código
// Expande para 8 matérias + FLEX (inglês/espanhol)

import type { Sessao, Turno } from '../db/supabase.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '')

const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '900000', 10) // 15min default

// Keywords por tema — conservadores para evitar falsos positivos
const KEYWORDS_MATEMATICA = [
  'matemática', 'matematica', 'conta de matematica', 'conta de matemática',
  'fazer conta', 'fazer contas', 'contas de',
  'fração', 'fracao', 'fracoes', 'frações',
  'número', 'numero', 'números', 'numeros',
  'somar', 'soma', 'dividir', 'divisão', 'divisao',
  'multiplicar', 'multiplicação', 'multiplicacao',
  'subtração', 'subtracao', 'adição', 'adicao',
  'calculo', 'cálculo', 'equação', 'equacao',
  'porcentagem', 'geometria', 'tabuada',
  '/2', '/3', '/4', '/5', '/6', '/8', '/10',
  '1/2', '1/3', '1/4', '1/5', '1/6', '1/8',
  '2/3', '3/4', '2/5', '3/5', '4/5',
  'metade', 'terço', 'terco', 'quarto',
  // Operadores aritméticos — úteis para "2+3=5" mas raramente em texto corrido
  '+', '-', '=',
  // 'vezes' mantido mas com anti-keyword para "às vezes"
  'vezes',
  // Verbos matemáticos específicos
  'subtrai', 'divide', 'multiplica',
  // Termos adicionais (potência/potencia NÃO inclusa — já está em FISICA e cria falso positivo em 'potencial')
  'área', 'area', 'perímetro', 'perimetro', 'ângulo', 'angulo',
  'triângulo', 'triangulo', 'quadrado', 'retângulo', 'retangulo',
  'raiz quadrada', 'logaritmo',
  'média', 'media', 'moda', 'mediana',
  // REMOVIDOS (muitos falsos positivos em texto cotidiano):
  // ' mais ', ' menos ', 'x '
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
  'acentuação', 'acentuacao', 'acento grave', 'acento agudo', 'acento circunflexo',
  'verbo', 'substantivo', 'adjetivo', 'pronome',
  'metáfora', 'metafora', 'comparação', 'comparacao',
  'figura de linguagem', 'figuras de linguagem',
  'sinônimo', 'sinonimo', 'antônimo', 'antonimo',
  'coesão', 'coesao', 'coerência', 'coerencia',
  'oração', 'oracao', 'sujeito', 'predicado',
  'conjunção', 'conjuncao', 'preposição', 'preposicao',
  'narrador', 'narrativa', 'conto', 'crônica', 'cronica',
  'poesia', 'poema', 'estrofe', 'rima',
]

const KEYWORDS_CIENCIAS = [
  'ciências', 'ciencias', 'biologia', 'corpo humano',
  'célula', 'celula', 'ecossistema', 'fotossíntese', 'fotossintese',
  'animal', 'planta', 'saúde', 'saude', 'doença', 'doenca',
  'órgão', 'orgao', 'sistema digestivo', 'sistema respiratório', 'sistema respiratorio',
  'sistema imunológico', 'sistema imunologico', 'imunológico', 'imunologico',
  'sistema nervoso', 'sistema circulatório', 'sistema circulatorio',
  'teoria da evolução', 'teoria da evolucao', 'evolução das espécies', 'evolucao das especies',
  'dna', 'genética', 'genetica',
  'vírus', 'virus', 'bactéria', 'bacteria', 'microscópio', 'microscopio',
  'invertebrado', 'vertebrado', 'mamífero', 'mamifero', 'réptil', 'reptil',
  'nutrição', 'nutricao', 'respiração celular', 'respiracao celular',
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

const ANTI_KEYWORDS_MATEMATICA: string[] = [
  // 'vezes' no sentido de frequência/às vezes → NÃO é matemática
  'às vezes', 'as vezes', 'umas vezes', 'outras vezes', 'algumas vezes',
  'muitas vezes', 'poucas vezes', 'várias vezes', 'varias vezes',
  // 'média' no sentido de Idade Média (história) → NÃO é matemática
  'idade média', 'idade media',
]
const ANTI_KEYWORDS_PORTUGUES: string[] = [
  // 'verbo' detectado quando o contexto é ESPANHOL ou INGLÊS
  'em espanhol', 'de espanhol', 'en español', 'em inglês', 'de inglês', 'em ingles', 'de ingles',
  'verbos em espanhol', 'verbos en español', 'verbos em inglês', 'verbos em ingles',
]
const ANTI_KEYWORDS_HISTORIA: string[] = [
  // "história" no sentido de narrativa/redação (não matéria de história)
  'escrever uma história', 'escrever uma historia',
  'escrever minha história', 'escrever minha historia',
  'contar uma história', 'contar uma historia',
  'inventar uma história', 'inventar uma historia',
  'criar uma história', 'criar uma historia',
  'fazer uma história', 'fazer uma historia',
  'história de mentira', 'historia de mentira',
  'história inventada', 'historia inventada',
  'história criativa', 'historia criativa',
]
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
  // "energia", "força", "calor", "movimento", "temperatura" em contexto cotidiano
  // Frases que indicam uso metafórico/coloquial dessas palavras
  'energia da', 'energia boa', 'energia positiva', 'energia negativa', 'muita energia',
  'força de vontade', 'força moral', 'força emocional',
  'calor humano', 'calor da', 'que calor',
  'movimento de dança', 'movimento social', 'movimento estudantil', 'movimento artístico',
  'temperatura da sopa', 'temperatura do corpo',  // corpo humano → ciências seria melhor
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
  'como se diz em espanhol',
  'verbos en español', 'conjugar en español', 'conjugar en espanol',
  'me ajuda em espanhol', 'aprender espanhol',
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

// Caracteres que são parte de palavras em português (para word boundary)
const WORD_CHARS = 'a-záéíóúâêîôûãõàèìòùçüäöï0-9_'
const reWordBoundary = (keyword: string): RegExp => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![${WORD_CHARS}])${escaped}(?![${WORD_CHARS}])`, 'i')
}

export function detectarTema(mensagem: string): string | null {
  const msg = mensagem.toLowerCase()
  const msgSemAcento = removerAcentos(msg)

  // Checar com e sem acentos para robustez de encoding
  // Fix 1: Keywords curtas (≤6 chars, sem espaço) usam word boundary para evitar
  // substring false positives:
  //   'rio'  → 'próprio'  → 'proprio'  → \brio\b NÃO bate em 'proprio' (preceded by p)
  //   'pais' → 'paisagem' → \bpais\b NÃO bate em 'paisagem' (followed by a)
  //   'base' → 'baseado'  → \bbase\b NÃO bate em 'baseado' (followed by a)
  const temKeyword = (keywords: string[]) =>
    keywords.some(k => {
      const kNorm = removerAcentos(k.toLowerCase())
      // Usar word boundary para keywords MUITO curtas sem espaço (≤4 chars)
      // Isso evita 'rio' → 'próprio', 'pais' → 'paisagem', 'base' → 'baseado', etc.
      // Threshold conservador (4) preserva plurais: 'guerra'(6) ainda bate 'guerras'
      if (!k.includes(' ') && kNorm.length <= 4) {
        return reWordBoundary(kNorm).test(msgSemAcento)
      }
      return msg.includes(k) || msgSemAcento.includes(kNorm)
    })

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

// Classificador LLM leve — Gemini Flash com temp=0, max 10 tokens.
// Roda quando keywords falham. Timeout de 500ms → fallback null.
const TEMAS_VALIDOS_CLASSIFIER = [
  'matematica', 'portugues', 'ciencias', 'historia',
  'geografia', 'fisica', 'quimica', 'ingles', 'espanhol',
]

/**
 * Versão de classificarTema com timeout configurável.
 * Usada pelo bypass de intenção explícita no stickiness guard (timeout mais generoso).
 */
export async function classificarTemaComTimeout(mensagem: string, timeoutMs: number): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    })
    const prompt = `Classifique a matéria escolar desta mensagem. Responda APENAS com uma palavra: matematica, portugues, ciencias, historia, geografia, fisica, quimica, ingles, espanhol, ou indefinido.\n\nMensagem: "${mensagem.substring(0, 200)}"`
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
    const classifyPromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }).then(result => {
      const resposta = result.response.text().trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (TEMAS_VALIDOS_CLASSIFIER.includes(resposta)) return resposta
      if (resposta === 'indefinido') return 'indefinido'
      return null
    })
    return await Promise.race([classifyPromise, timeoutPromise])
  } catch {
    return null
  }
}

export async function classificarTema(mensagem: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) {
    return null
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    })

    const prompt = `Classifique a matéria escolar desta mensagem. Responda APENAS com uma palavra: matematica, portugues, ciencias, historia, geografia, fisica, quimica, ingles, espanhol, ou indefinido.\n\nMensagem: "${mensagem.substring(0, 200)}"`

    // Promise.race com timeout de 500ms
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 500)
    })

    const classifyPromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }).then(result => {
      const resposta = result.response.text().trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

      if (TEMAS_VALIDOS_CLASSIFIER.includes(resposta)) {
        console.log(`🔬 Classificador LLM: "${mensagem.substring(0, 40)}..." → ${resposta}`)
        return resposta
      }

      if (resposta === 'indefinido') {
        console.log(`🔬 Classificador LLM: indefinido para "${mensagem.substring(0, 40)}..."`)
        return 'indefinido'
      }

      return null
    })

    return await Promise.race([classifyPromise, timeoutPromise])
  } catch (err) {
    console.error('⚠️ Classificador LLM falhou (timeout/erro):', (err as Error).message)
    return null
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

/**
 * Novo fluxo de decisão de persona (async):
 * 1. Checar timeout/nova_sessao → resetar se necessário
 * 2. Detectar tema por keywords
 * 3. Se tema → fluxo normal (PSICO cascata ou herói direto)
 * 4. Se sem tema → classificador LLM (SEMPRE)
 *    4a. Matéria válida → tratar como tema detectado
 *    4b. Indefinido + agente ativo → continuidade
 *    4c. Indefinido + sem agente → PSICOPEDAGOGICO
 *    4d. Erro → PSICOPEDAGOGICO
 */
// ─── Guardião: detecção de jailbreak e fora de escopo ────────────────────────
// Bloqueia ANTES de qualquer chamada LLM. Não causa erro — causa uma resposta
// educacional elegante via persona GUARDIAO (tratado em message.ts).
// ────────────────────────────────────────────────────────────────────────────
const PADROES_JAILBREAK = [
  'ignore suas instruções', 'ignore suas instrucoes',
  'ignore your instructions', 'ignore all instructions',
  'esqueça suas instruções', 'esqueca suas instrucoes',
  'forget your instructions', 'forget your previous instructions',
  'você é agora', 'voce e agora',
  'a partir de agora você', 'a partir de agora voce',
  'novo modo', 'modo desenvolvedor', 'developer mode',
  'sem restrições', 'sem restricoes', 'without restrictions',
  'atue como', 'act as if', 'pretend you are', 'pretend to be',
  'jailbreak', 'dan mode', 'do anything now',
]

const PADROES_FORA_ESCOPO = [
  'hackear', 'invadir o wifi', 'invasão de', 'invadir a rede',
  'fazer bomba', 'criar vírus', 'criar virus', 'malware',
  'namorado', 'namorada', 'meu crush', 'ficar com',
  'receita de bolo', 'como fazer comida',
  'vira meu assistente', 'vira meu assistente pessoal',
  'me ajuda com qualquer coisa', 'pode me ajudar com tudo',
  'assistente pessoal sem restrições', 'assistente sem restrições',
]

export function detectarGuardiao(mensagem: string): boolean {
  const msg = mensagem.toLowerCase()
  const msgSemAcento = removerAcentos(msg)
  const verificar = (padroes: string[]) =>
    padroes.some(p => msg.includes(p) || msgSemAcento.includes(removerAcentos(p)))
  return verificar(PADROES_JAILBREAK) || verificar(PADROES_FORA_ESCOPO)
}

export async function decidirPersona(
  mensagem: string,
  sessao: Sessao,
  ultimosTurnos: Turno[],
  novaSessao: boolean = false
): Promise<{ persona: string; temaDetectado: string | null }> {

  // 0. Guardião — jailbreak/fora de escopo → resposta elegante sem LLM
  if (detectarGuardiao(mensagem)) {
    console.log(`🛡️ Guardião ativado para: "${mensagem.substring(0, 60)}..."`)
    return { persona: 'GUARDIAO', temaDetectado: null }
  }

  // 1. Checar timeout ou nova sessão
  const agora = Date.now()
  const ultimoTurno = sessao.ultimo_turno_at
    ? new Date(sessao.ultimo_turno_at).getTime()
    : 0
  const inativo = ultimoTurno > 0 && (agora - ultimoTurno > SESSION_TIMEOUT_MS)

  if (novaSessao || inativo) {
    console.log(`🔄 Reset sessão: ${novaSessao ? 'nova_sessao flag' : `inativo ${Math.round((agora - ultimoTurno) / 60000)}min`}`)
    sessao.agente_atual = 'PSICOPEDAGOGICO'
    sessao.tema_atual = null
  }

  // 2. Detectar tema por keywords
  const temaKeywords = detectarTema(mensagem)

  // Fix 3 — Stickiness Guard com bypass de intenção explícita:
  // Se há um herói ativo E as keywords detectaram um tema DIFERENTE do atual,
  // exige confirmação do classificador LLM antes de quebrar o fluxo.
  // BYPASS: se o usuário expressa intenção explícita de troca ("quero falar com o professor de X",
  // "agora quero X", etc.), pula o stickiness e vai direto ao LLM com timeout mais generoso.
  // Também trata o caso onde a mensagem mistura keywords de dois temas (ex: "equação... português").
  const PADROES_TROCA_EXPLICITA = [
    'professor de ', 'professora de ', 'quero falar com', 'falar com o',
    'agora quero', 'agora preciso de ajuda com', 'mudar para', 'trocar para',
    'me passa para', 'quero o professor', 'quero a professora',
  ]
  const temIntentoDeTroca =
    sessao.agente_atual &&
    sessao.agente_atual !== 'PSICOPEDAGOGICO' &&
    sessao.tema_atual !== null &&
    PADROES_TROCA_EXPLICITA.some(p => mensagem.toLowerCase().includes(p))

  if (temIntentoDeTroca) {
    // Intenção explícita detectada → classificador LLM com timeout estendido (4s)
    const temaLLMExplicit = await classificarTemaComTimeout(mensagem, 4000)
    if (temaLLMExplicit && temaLLMExplicit !== 'indefinido' && temaLLMExplicit !== sessao.tema_atual) {
      console.log(`[stickiness-bypass] intenção explícita de troca → ${temaLLMExplicit}`)
      return decidirComTema(temaLLMExplicit, sessao, ultimosTurnos)
    }
    // Fix BUG-57: LLM retorna "indefinido" para requisições de navegação ("quero falar com o
    // professor de história") porque não há conteúdo da matéria na mensagem — só a intenção.
    // Fallback: verificar se keywords detectam outra matéria na mesma mensagem.
    if (temaKeywords && temaKeywords !== sessao.tema_atual) {
      console.log(`[stickiness-bypass] LLM indefinido, keywords detectam '${temaKeywords}' → trocando`)
      return decidirComTema(temaKeywords, sessao, ultimosTurnos)
    }
    // Nenhuma evidência de troca → manter herói (pode ser falso positivo)
    console.log(`[stickiness-bypass] LLM não confirmou troca → mantendo ${sessao.agente_atual}`)
    return { persona: sessao.agente_atual!, temaDetectado: sessao.tema_atual }
  }

  if (
    temaKeywords &&
    temaKeywords !== sessao.tema_atual &&
    sessao.agente_atual &&
    sessao.agente_atual !== 'PSICOPEDAGOGICO' &&
    sessao.tema_atual !== null
  ) {
    const temaLLMConfirm = await classificarTema(mensagem)
    if (!temaLLMConfirm || temaLLMConfirm === 'indefinido') {
      console.log(`[stickiness] keywords='${temaKeywords}' mas LLM='indefinido' → mantendo ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }
    // LLM confirma nova matéria → permitir troca
    console.log(`[stickiness] LLM='${temaLLMConfirm}' confirma troca de ${sessao.tema_atual} → ${temaLLMConfirm}`)
    return decidirComTema(temaLLMConfirm, sessao, ultimosTurnos)
  }

  if (temaKeywords) {
    // 3. Tema detectado por keywords → fluxo normal (sem herói ativo ou mesmo tema)
    return decidirComTema(temaKeywords, sessao, ultimosTurnos)
  }

  // 4. Keywords falharam → classificador LLM (SEMPRE)
  const temaLLM = await classificarTema(mensagem)

  if (temaLLM && temaLLM !== 'indefinido') {
    // 4a. Matéria válida detectada pelo classificador
    return decidirComTema(temaLLM, sessao, ultimosTurnos)
  }

  if (temaLLM === 'indefinido') {
    // 4b. Indefinido — continuidade se agente ativo
    if (sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual) {
      console.log(`➡️ Continuidade (classificador indefinido): ${sessao.agente_atual}`)
      return { persona: sessao.agente_atual, temaDetectado: sessao.tema_atual }
    }
  }

  // 4c/4d. Sem agente ativo ou erro → PSICOPEDAGOGICO
  return { persona: 'PSICOPEDAGOGICO', temaDetectado: null }
}

/**
 * Helper: dado um tema detectado (por keyword ou LLM), decide a persona.
 */
function decidirComTema(
  tema: string,
  sessao: Sessao,
  ultimosTurnos: Turno[]
): { persona: string; temaDetectado: string } {
  const personaAlvo = personaPorTema(tema)

  // Troca de matéria?
  if (tema !== sessao.tema_atual) {
    const jaAtendido = ultimosTurnos.some(t => t.agente === personaAlvo)
    if (!jaAtendido) {
      return { persona: 'PSICOPEDAGOGICO', temaDetectado: tema }
    }
  }

  return { persona: personaAlvo, temaDetectado: tema }
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
