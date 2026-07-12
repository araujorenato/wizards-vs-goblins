import { useEffect, useRef, useState } from 'react'

/**
 * Animates a displayed integer counting down 1-by-1 toward `target` over
 * `durationMs`, linearly spaced. Resets (snaps, no animation) whenever
 * `resetKey` changes — used so a brand new enemy's stats appear instantly
 * instead of visibly "counting down" from the previous enemy's numbers.
 */
export function useCountdown(target: number, resetKey: unknown, durationMs = 800): number {
  const [display, setDisplay] = useState(target)
  const prevTargetRef = useRef(target)
  const prevKeyRef = useRef(resetKey)

  useEffect(() => {
    if (resetKey !== prevKeyRef.current) {
      prevKeyRef.current = resetKey
      prevTargetRef.current = target
      setDisplay(target)
      return
    }

    const from = prevTargetRef.current
    prevTargetRef.current = target

    if (target >= from) {
      setDisplay(target)
      return
    }

    const steps = from - target
    const stepDuration = durationMs / steps
    let current = from
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (cancelled) return
      current -= 1
      setDisplay(current)
      if (current > target) {
        timer = setTimeout(tick, stepDuration)
      }
    }
    timer = setTimeout(tick, stepDuration)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [target, resetKey, durationMs])

  return display
}
