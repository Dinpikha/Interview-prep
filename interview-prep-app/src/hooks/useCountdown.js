import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A ticking countdown that survives re-renders and lets you pause/resume/reset.
 *
 * @param {number} initialSeconds - seconds to count down from
 * @param {object} options
 * @param {() => void} [options.onExpire] - fired once when the timer hits 0
 * @param {boolean} [options.autoStart=true]
 */
export function useCountdown(initialSeconds, { onExpire, autoStart = true } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!isRunning) return undefined

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const reset = useCallback((nextSeconds = initialSeconds, { start = true } = {}) => {
    setSecondsLeft(nextSeconds)
    setIsRunning(start)
  }, [initialSeconds])

  const pause = useCallback(() => setIsRunning(false), [])
  const resume = useCallback(() => setIsRunning(true), [])

  return { secondsLeft, isRunning, reset, pause, resume }
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Parses "45 min" / "60 min" style strings from mock interview data into seconds. */
export function parseDurationToSeconds(durationLabel, fallbackMinutes = 30) {
  const match = /(\d+)/.exec(durationLabel ?? '')
  const minutes = match ? Number(match[1]) : fallbackMinutes
  return minutes * 60
}
