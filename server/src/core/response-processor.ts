// ============================================================
// RESPONSE PROCESSOR — Pipeline Central de Disjuntores (Bloco H)
// ============================================================
// TODAS as respostas LLM passam por aqui antes de chegar ao destino.
// Pipeline: JSON.parse → markdown block → regex fallback → texto puro
// Sanitizador INCONDICIONAL remove resíduos JSON antes de enviar ao aluno.

// ============================================================
// INTERFACES
// ============================================================

export interface SinaisPedagogicos {
  sinal_psicopedagogico: boolean
  motivo_sinal: string | null
  observacoes_internas: string | null
}

export interface IntencaoCascata {
  acao: string
  heroi_escolhido: string | null
  plano_atendimento: Record<string, unknown> | null
  instrucoes_para_heroi: string | null
  resposta_para_aluno: string | null
  super_prova_query: string | null  // Tópico específico para Super Prova (ex: "quilombos_atualidade")
}

export interface ProcessedResponse {
  textoLimpo: string
  jsonOriginal: Record<string, unknown> | null
  sinais: SinaisPedagogicos | null
  cascata: IntencaoCascata | null
  metadados: {
    metodo_extracao: 'json_parse' | 'json_parse_markdown' | 'regex_fallback' | 'texto_puro'
    sanitizado: boolean
    usou_fallback: boolean
  }
}

// ============================================================
// FALLBACK MESSAGES POR PERSONA
// ============================================================

const FALLBACK_MESSAGES: Record<string, string> = {
  CALCULUS: 'Opa! Tive um pequeno problema técnico. Vamos tentar de novo? Me conta sua dúvida de matemática! 🔢',
  VERBETTA: 'Eita! Algo deu errado aqui. Vamos recomeçar? Me conta o que você precisa sobre português! 📝',
  NEURON: 'Ops! Um pequeno bug no laboratório. Vamos tentar de novo? Qual sua dúvida de ciências? 🔬',
  TEMPUS: 'Puxa! Uma falha na máquina do tempo. Vamos recomeçar? Me conta sua dúvida de história! ⏳',
  GAIA: 'Ops! Um tremor técnico aqui. Vamos tentar de novo? Qual sua dúvida de geografia? 🌍',
  VECTOR: 'Epa! Uma falha no sistema. Vamos recomeçar? Me conta sua dúvida de física! ⚡',
  ALKA: 'Ops! Uma reação inesperada no lab. Vamos tentar de novo? Qual sua dúvida de química? ⚗️',
  FLEX: 'Oops! A little glitch here. Let\'s try again? What\'s your question? 🌎',
  PSICOPEDAGOGICO: 'Oi! Tive um pequeno problema. Vamos tentar de novo? Me conta como posso te ajudar! 😊',
  SUPERVISOR_EDUCACIONAL: 'Olá! Houve um problema técnico ao gerar o resumo. Tente novamente em alguns instantes.',
  DEFAULT: 'Ops! Algo deu errado. Pode repetir sua mensagem? 😊'
}

function getFallbackMessage(persona: string): string {
  return FALLBACK_MESSAGES[persona] || FALLBACK_MESSAGES['DEFAULT']
}

// ============================================================
// CAMPOS DE TEXTO CONHECIDOS (ordem de prioridade)
// ============================================================

const CAMPOS_TEXTO = [
  'resposta_para_aluno',
  'reply_text',
  'mensagem_ao_aluno',
  'mensagem',
  'texto',
  'resumo_text',
  'resposta',
  'response',
  'message',
]

function extrairTextoDoCampo(json: Record<string, unknown>): string | null {
  for (const campo of CAMPOS_TEXTO) {
    if (typeof json[campo] === 'string' && (json[campo] as string).trim()) {
      return json[campo] as string
    }
  }
  return null
}

// ============================================================
// SANITIZADOR — SEMPRE roda antes de enviar texto ao aluno
// ============================================================

function sanitizarTexto(texto: string): { texto: string; precisouSanitizar: boolean } {
  const original = texto

  // Remover blocos JSON completos
  let sanitizado = texto.replace(/\{[\s\S]*?"(?:agent_id|acao|reply_text|resposta_para_aluno)"[\s\S]*?\}/g, '')

  // Remover campos JSON soltos (ex: "agent_id": "CALCULUS",)
  sanitizado = sanitizado.replace(/"(?:agent_id|tema|sinal_psicopedagogico|motivo_sinal|observacoes_internas|acao|heroi_escolhido|plano_atendimento|instrucoes_para_heroi)"\s*:\s*(?:"[^"]*"|null|true|false|\{[^}]*\}),?\s*/g, '')

  // Remover chaves e colchetes órfãos
  sanitizado = sanitizado.replace(/^\s*[\{\}]\s*$/gm, '')

  // Remover markdown code blocks
  sanitizado = sanitizado.replace(/```(?:json)?\s*/g, '')

  // Limpar espaços múltiplos e linhas em branco
  sanitizado = sanitizado.replace(/\n{3,}/g, '\n\n').trim()

  return {
    texto: sanitizado || original,
    precisouSanitizar: sanitizado !== original
  }
}

// ============================================================
// EXTRAÇÃO DE SINAIS PEDAGÓGICOS
// ============================================================

function extrairSinais(json: Record<string, unknown>): SinaisPedagogicos | null {
  const sinal = json.sinal_psicopedagogico
  if (sinal === true || sinal === 'true') {
    return {
      sinal_psicopedagogico: true,
      motivo_sinal: typeof json.motivo_sinal === 'string' ? json.motivo_sinal : null,
      observacoes_internas: typeof json.observacoes_internas === 'string' ? json.observacoes_internas : null
    }
  }
  // Mesmo sem sinal, extrair observações se existirem
  if (typeof json.observacoes_internas === 'string' && json.observacoes_internas) {
    return {
      sinal_psicopedagogico: false,
      motivo_sinal: null,
      observacoes_internas: json.observacoes_internas
    }
  }
  return null
}

// ============================================================
// EXTRAÇÃO DE INTENÇÃO CASCATA (PSICOPEDAGOGICO)
// ============================================================

function extrairCascata(json: Record<string, unknown>): IntencaoCascata | null {
  const acao = (json.acao || json.action) as string | undefined
  if (!acao) return null

  return {
    acao,
    heroi_escolhido: (json.heroi_escolhido ?? json.agente_destino ?? json.heroi ?? json.agente ?? null) as string | null,
    plano_atendimento: (json.plano_atendimento ?? json.plano_pedagogico ?? json.plano ?? null) as Record<string, unknown> | null,
    instrucoes_para_heroi: (json.instrucoes_para_heroi ?? json.instrucoes_para_agente ?? json.instrucoes ?? null) as string | null,
    resposta_para_aluno: (json.resposta_para_aluno ?? null) as string | null,
    super_prova_query: (json.super_prova_query ?? null) as string | null
  }
}

// ============================================================
// REGEX FALLBACK — para JSON truncado ou malformado
// ============================================================

function extrairPorRegex(raw: string): { texto: string | null; sinais: SinaisPedagogicos | null; cascata: IntencaoCascata | null } {
  let texto: string | null = null
  let sinais: SinaisPedagogicos | null = null
  let cascata: IntencaoCascata | null = null

  // Extrair campos de texto
  for (const campo of CAMPOS_TEXTO) {
    const regex = new RegExp(`"${campo}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`)
    const match = raw.match(regex)
    if (match) {
      texto = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
      break
    }
  }

  // Extrair sinais
  const sinalMatch = raw.match(/"sinal_psicopedagogico"\s*:\s*(true|false)/)
  if (sinalMatch && sinalMatch[1] === 'true') {
    const motivoMatch = raw.match(/"motivo_sinal"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    const obsMatch = raw.match(/"observacoes_internas"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    sinais = {
      sinal_psicopedagogico: true,
      motivo_sinal: motivoMatch ? motivoMatch[1] : null,
      observacoes_internas: obsMatch ? obsMatch[1] : null
    }
  }

  // Extrair cascata
  const acaoMatch = raw.match(/"acao"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (acaoMatch) {
    const heroiMatch = raw.match(/"heroi_escolhido"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    const respostaMatch = raw.match(/"resposta_para_aluno"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    const instrucoesMatch = raw.match(/"instrucoes_para_heroi"\s*:\s*"((?:[^"\\]|\\.)*)"/)

    cascata = {
      acao: acaoMatch[1],
      heroi_escolhido: heroiMatch ? heroiMatch[1] : null,
      plano_atendimento: null, // Muito complexo para regex
      instrucoes_para_heroi: instrucoesMatch ? instrucoesMatch[1] : null,
      resposta_para_aluno: respostaMatch ? respostaMatch[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') : null,
      super_prova_query: null  // Regex fallback não extrai super_prova_query
    }

    // Se temos resposta_para_aluno na cascata, pode ser o texto
    if (!texto && cascata.resposta_para_aluno) {
      texto = cascata.resposta_para_aluno
    }
  }

  return { texto, sinais, cascata }
}

// ============================================================
// PIPELINE PRINCIPAL
// ============================================================

export function processarRespostaLLM(raw: string, persona: string): ProcessedResponse {
  if (!raw || !raw.trim()) {
    return {
      textoLimpo: getFallbackMessage(persona),
      jsonOriginal: null,
      sinais: null,
      cascata: null,
      metadados: {
        metodo_extracao: 'texto_puro',
        sanitizado: false,
        usou_fallback: true
      }
    }
  }

  const trimmed = raw.trim()

  // ── CAMADA 1: JSON.parse direto ──
  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>
    const texto = extrairTextoDoCampo(json)

    if (texto) {
      // Sanitizar SEMPRE
      const sanitizadoResult = sanitizarTexto(texto)

      return {
        textoLimpo: sanitizadoResult.texto,
        jsonOriginal: json,
        sinais: extrairSinais(json),
        cascata: extrairCascata(json),
        metadados: {
          metodo_extracao: 'json_parse',
          sanitizado: sanitizadoResult.precisouSanitizar,
          usou_fallback: false
        }
      }
    }

    // JSON válido mas sem campo de texto reconhecido — pode ser PSICO sem resposta_para_aluno
    const cascata = extrairCascata(json)
    if (cascata) {
      return {
        textoLimpo: cascata.resposta_para_aluno || getFallbackMessage(persona),
        jsonOriginal: json,
        sinais: extrairSinais(json),
        cascata,
        metadados: {
          metodo_extracao: 'json_parse',
          sanitizado: false,
          usou_fallback: !cascata.resposta_para_aluno
        }
      }
    }

    // JSON sem campos úteis — fallback
    return {
      textoLimpo: getFallbackMessage(persona),
      jsonOriginal: json,
      sinais: null,
      cascata: null,
      metadados: {
        metodo_extracao: 'json_parse',
        sanitizado: false,
        usou_fallback: true
      }
    }
  } catch {
    // Não é JSON válido — seguir para próxima camada
  }

  // ── CAMADA 2: Markdown code block ──
  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (markdownMatch) {
    try {
      const json = JSON.parse(markdownMatch[1].trim()) as Record<string, unknown>
      const texto = extrairTextoDoCampo(json)

      if (texto) {
        const sanitizadoResult = sanitizarTexto(texto)
        return {
          textoLimpo: sanitizadoResult.texto,
          jsonOriginal: json,
          sinais: extrairSinais(json),
          cascata: extrairCascata(json),
          metadados: {
            metodo_extracao: 'json_parse_markdown',
            sanitizado: sanitizadoResult.precisouSanitizar,
            usou_fallback: false
          }
        }
      }

      const cascata = extrairCascata(json)
      if (cascata) {
        return {
          textoLimpo: cascata.resposta_para_aluno || getFallbackMessage(persona),
          jsonOriginal: json,
          sinais: extrairSinais(json),
          cascata,
          metadados: {
            metodo_extracao: 'json_parse_markdown',
            sanitizado: false,
            usou_fallback: !cascata.resposta_para_aluno
          }
        }
      }
    } catch {
      // Markdown block não é JSON válido — seguir
    }
  }

  // ── CAMADA 3: Regex fallback (JSON truncado/malformado) ──
  const temIndicioJSON = trimmed.includes('{') && (
    trimmed.includes('"reply_text"') ||
    trimmed.includes('"resposta_para_aluno"') ||
    trimmed.includes('"acao"') ||
    trimmed.includes('"agent_id"')
  )

  if (temIndicioJSON) {
    const { texto, sinais, cascata } = extrairPorRegex(trimmed)

    if (texto) {
      const sanitizadoResult = sanitizarTexto(texto)
      return {
        textoLimpo: sanitizadoResult.texto,
        jsonOriginal: null,
        sinais,
        cascata,
        metadados: {
          metodo_extracao: 'regex_fallback',
          sanitizado: sanitizadoResult.precisouSanitizar,
          usou_fallback: false
        }
      }
    }

    // Regex achou cascata mas sem texto
    if (cascata) {
      return {
        textoLimpo: cascata.resposta_para_aluno || getFallbackMessage(persona),
        jsonOriginal: null,
        sinais,
        cascata,
        metadados: {
          metodo_extracao: 'regex_fallback',
          sanitizado: false,
          usou_fallback: !cascata.resposta_para_aluno
        }
      }
    }

    // Tem indício de JSON mas não conseguiu extrair nada útil → fallback
    return {
      textoLimpo: getFallbackMessage(persona),
      jsonOriginal: null,
      sinais: null,
      cascata: null,
      metadados: {
        metodo_extracao: 'regex_fallback',
        sanitizado: false,
        usou_fallback: true
      }
    }
  }

  // ── CAMADA 4: Texto puro ──
  const sanitizadoResult = sanitizarTexto(trimmed)
  return {
    textoLimpo: sanitizadoResult.texto,
    jsonOriginal: null,
    sinais: null,
    cascata: null,
    metadados: {
      metodo_extracao: 'texto_puro',
      sanitizado: sanitizadoResult.precisouSanitizar,
      usou_fallback: false
    }
  }
}
