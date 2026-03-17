import { useState, useRef, useCallback, useEffect } from 'react'

interface UseBubbleRevealOptions {
  initialDelay?: number
  minDotsTime?: number
}

interface UseBubbleRevealReturn {
  visibleBubbles: string[]
  isRevealing: boolean
  showDots: boolean
  startReveal: (sentences: string[]) => void
  reset: () => void
}

export function useBubbleReveal(
  options: UseBubbleRevealOptions = {}
): UseBubbleRevealReturn {
  const { initialDelay = 400, minDotsTime = 400 } = options

  const [visibleCount, setVisibleCount] = useState(0)
  const [showDots, setShowDots] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  const sentencesRef = useRef<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (dotsTimerRef.current) {
      clearTimeout(dotsTimerRef.current)
      dotsTimerRef.current = null
    }
  }, [])

  const revealNext = useCallback(() => {
    const currentCount = sentencesRef.current.length

    setVisibleCount(prev => {
      const next = prev + 1

      if (next >= currentCount) {
        setShowDots(false)
        setIsRevealing(false)
        return next
      }

      const justRevealed = sentencesRef.current[next - 1] || ''
      const wordCount = justRevealed.split(/\s+/).filter(Boolean).length
      const readingDelay = Math.max(800, wordCount * 120)

      timerRef.current = setTimeout(() => {
        setShowDots(true)
        dotsTimerRef.current = setTimeout(() => {
          setShowDots(false)
          revealNext()
        }, minDotsTime)
      }, readingDelay)

      return next
    })
  }, [minDotsTime])

  const startReveal = useCallback((sentences: string[]) => {
    clearTimers()
    sentencesRef.current = sentences
    setVisibleCount(0)
    setIsRevealing(true)
    setShowDots(true)

    timerRef.current = setTimeout(() => {
      setShowDots(false)
      revealNext()
    }, Math.max(initialDelay, minDotsTime))
  }, [clearTimers, revealNext, initialDelay, minDotsTime])

  const reset = useCallback(() => {
    clearTimers()
    sentencesRef.current = []
    setVisibleCount(0)
    setShowDots(false)
    setIsRevealing(false)
  }, [clearTimers])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const visibleBubbles = sentencesRef.current.slice(0, visibleCount)

  return {
    visibleBubbles,
    isRevealing,
    showDots,
    startReveal,
    reset,
  }
}
