// server/src/utils/detect-url.ts
// Detecção de URLs em mensagens de alunos — função pura, zero dependências externas

const URL_REGEX = /https?:\/\/[^\s]+/i

export interface DeteccaoURL {
  url: string
  temContexto: boolean  // true se houver ≥10 chars de texto além da URL
}

/**
 * Detecta a primeira URL com protocolo explícito (https?://) na mensagem.
 * Retorna null se nenhuma URL encontrada.
 *
 * Regra de contexto: ≥10 chars de texto além da URL = aluno deu contexto suficiente.
 *
 * Exemplos:
 *   "https://historia.com/q"            → { url, temContexto: false } (0 chars)
 *   "veja https://historia.com/q"       → { url, temContexto: false } (4 chars — pede contexto)
 *   "sobre quilombos https://..."       → { url, temContexto: true  } (14 chars ✅)
 *   "www.historia.com"                  → null  (sem protocolo)
 *   "v1.0.3"                            → null  (sem protocolo)
 *   "Eu.não.sei.essa.matéria"           → null  (sem protocolo)
 *   "arquivo.txt"                       → null  (sem protocolo)
 */
export function detectarURL(texto: string): DeteccaoURL | null {
  const match = texto.match(URL_REGEX)
  if (!match) return null

  const url = match[0]
  const textoAlem = texto.replace(url, '').trim()

  return {
    url,
    temContexto: textoAlem.length >= 10,
  }
}
