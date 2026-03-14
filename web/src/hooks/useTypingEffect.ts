import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook de efeito de digitação — revela texto a uma velocidade humana.
 *
 * O SSE do LLM envia chunks rápido demais (rajadas de tokens).
 * Este hook bufferiza e revela a uma taxa controlada, criando
 * a sensação de que o professor está digitando em tempo real.
 *
 * Comportamento:
 * - Caracteres normais: revelados a CHARS_PER_TICK por frame (~25ms)
 * - Quebra de parágrafo (\n\n): pausa extra de PARAGRAPH_PAUSE_MS
 * - Flush final: quando done=true, acelera para revelar o restante
 */

const CHARS_PER_TICK = 2
const TICK_INTERVAL_MS = 35
const PARAGRAPH_PAUSE_MS = 800
const FLUSH_CHARS_PER_TICK = 8

interface UseTypingEffectReturn {
  displayText: string
  isRevealing: boolean
  addChunk: (text: string) => void
  flush: (onComplete: () => void) => void
  reset: () => void
}

export function useTypingEffect(): UseTypingEffectReturn {
  const [displayText, setDisplayText] = useState('')
  const [isRevealing, setIsRevealing] = useState(false)

  const bufferRef = useRef('')
  const cursorRef = useRef(0)
  const flushingRef = useRef(false)
  const pauseUntilRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef<(() => void) | null>(null)

  const stopLoop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRevealing(false)
    if (onCompleteRef.current) {
      const cb = onCompleteRef.current
      onCompleteRef.current = null
      cb()
    }
  }, [])

  const startLoop = useCallback(() => {
    if (timerRef.current) return

    setIsRevealing(true)
    timerRef.current = setInterval(() => {
      const buffer = bufferRef.current
      const cursor = cursorRef.current

      if (cursor >= buffer.length) {
        if (flushingRef.current) {
          stopLoop()
        }
        return
      }

      if (pauseUntilRef.current > Date.now()) return

      const charsPerTick = flushingRef.current ? FLUSH_CHARS_PER_TICK : CHARS_PER_TICK
      let nextCursor = Math.min(cursor + charsPerTick, buffer.length)

      const revealed = buffer.slice(cursor, nextCursor)
      const paragraphBreak = revealed.indexOf('\n\n')
      if (paragraphBreak >= 0 && !flushingRef.current) {
        nextCursor = cursor + paragraphBreak + 2
        pauseUntilRef.current = Date.now() + PARAGRAPH_PAUSE_MS
      }

      cursorRef.current = nextCursor
      setDisplayText(buffer.slice(0, nextCursor))
    }, TICK_INTERVAL_MS)
  }, [stopLoop])

  const addChunk = useCallback((text: string) => {
    bufferRef.current += text
    startLoop()
  }, [startLoop])

  const flush = useCallback((onComplete: () => void) => {
    onCompleteRef.current = onComplete
    flushingRef.current = true
    if (!timerRef.current && cursorRef.current < bufferRef.current.length) {
      startLoop()
    } else if (cursorRef.current >= bufferRef.current.length) {
      // Já terminou de revelar — chamar onComplete direto
      stopLoop()
    }
  }, [startLoop, stopLoop])

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    bufferRef.current = ''
    cursorRef.current = 0
    flushingRef.current = false
    pauseUntilRef.current = 0
    onCompleteRef.current = null
    setDisplayText('')
    setIsRevealing(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { displayText, isRevealing, addChunk, flush, reset }
}
