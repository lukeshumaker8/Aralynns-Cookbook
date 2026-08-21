import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'cookbook-timers'

// Timers are stored as an absolute end time rather than a countdown, so locking
// the phone or backgrounding the PWA does not stop the clock.
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(timers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
  } catch {
    // Storage full or blocked — timers still work for this session.
  }
}

export function remainingSeconds(timer) {
  if (timer.pausedRemaining != null) return timer.pausedRemaining
  return Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000))
}

/**
 * A short repeating chime built with WebAudio, so there is no audio file to
 * ship and no autoplay policy to fight — the context is created during the tap
 * that starts the timer.
 */
function createAlarm() {
  let context = null

  const ensureContext = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    if (!context) context = new AudioContextClass()
    if (context.state === 'suspended') context.resume()
    return context
  }

  return {
    // Called on user interaction so iOS lets us make noise later.
    unlock: ensureContext,
    play() {
      const ctx = ensureContext()
      if (!ctx) return

      // Three rising beeps.
      ;[0, 0.35, 0.7].forEach((offset, i) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.value = 660 + i * 110
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.28)

        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start(ctx.currentTime + offset)
        oscillator.stop(ctx.currentTime + offset + 0.3)
      })
    },
  }
}

export function useTimers() {
  const [timers, setTimers] = useState(load)
  const [, forceTick] = useState(0)
  const alarmRef = useRef(null)
  const firedRef = useRef(new Set())

  if (!alarmRef.current && typeof window !== 'undefined') {
    alarmRef.current = createAlarm()
  }

  useEffect(() => {
    save(timers)
  }, [timers])

  // Re-render every 250ms so the countdown stays smooth without storing it.
  useEffect(() => {
    if (timers.length === 0) return undefined

    const interval = setInterval(() => forceTick((n) => n + 1), 250)
    return () => clearInterval(interval)
  }, [timers.length])

  // Fire alarms for timers that just hit zero.
  useEffect(() => {
    const done = timers.filter((t) => t.pausedRemaining == null && remainingSeconds(t) === 0)

    done.forEach((timer) => {
      if (firedRef.current.has(timer.id)) return
      firedRef.current.add(timer.id)

      alarmRef.current?.play()

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Timer finished', {
            body: timer.label,
            tag: timer.id,
            requireInteraction: true,
          })
        } catch {
          // Some browsers only allow notifications from a service worker.
        }
      }

      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300])
    })
  })

  const addTimer = useCallback((seconds, label) => {
    alarmRef.current?.unlock()

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    const timer = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: label || 'Timer',
      durationSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      pausedRemaining: null,
    }

    setTimers((current) => [...current, timer])
    return timer
  }, [])

  const removeTimer = useCallback((id) => {
    firedRef.current.delete(id)
    setTimers((current) => current.filter((t) => t.id !== id))
  }, [])

  const togglePause = useCallback((id) => {
    setTimers((current) =>
      current.map((timer) => {
        if (timer.id !== id) return timer

        if (timer.pausedRemaining != null) {
          return { ...timer, endsAt: Date.now() + timer.pausedRemaining * 1000, pausedRemaining: null }
        }

        return { ...timer, pausedRemaining: remainingSeconds(timer) }
      })
    )
  }, [])

  const addMinute = useCallback((id) => {
    firedRef.current.delete(id)

    setTimers((current) =>
      current.map((timer) => {
        if (timer.id !== id) return timer

        if (timer.pausedRemaining != null) {
          return { ...timer, pausedRemaining: timer.pausedRemaining + 60 }
        }

        // Extend from now when the timer has already run out.
        const base = Math.max(timer.endsAt, Date.now())
        return { ...timer, endsAt: base + 60 * 1000 }
      })
    )
  }, [])

  const clearFinished = useCallback(() => {
    setTimers((current) =>
      current.filter((t) => t.pausedRemaining != null || remainingSeconds(t) > 0)
    )
  }, [])

  return { timers, addTimer, removeTimer, togglePause, addMinute, clearFinished }
}
