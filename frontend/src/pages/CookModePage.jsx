import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TimerBar from '../components/TimerBar'
import { useTimers } from '../hooks/useTimers'
import { findDurations, describeDuration } from '../utils/timerParser'

const PRESET_MINUTES = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60]

function CookModePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [showTimerPicker, setShowTimerPicker] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')

  const { timers, addTimer, removeTimer, togglePause, addMinute } = useTimers()

  const touchStartX = useRef(null)
  const wakeLockRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const fetchRecipe = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/recipes/${id}`)
        if (!res.ok) throw new Error('Recipe not found')
        const data = await res.json()
        if (!cancelled) {
          setRecipe(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRecipe()
    return () => {
      cancelled = true
    }
  }, [id])

  const steps = useMemo(() => {
    if (!recipe?.instructions) return []
    return recipe.instructions
      .map((step) => (typeof step === 'string' ? step : step.instruction))
      .filter(Boolean)
  }, [recipe])

  const totalSteps = steps.length
  const isFinished = totalSteps > 0 && stepIndex >= totalSteps
  const currentStep = isFinished ? null : steps[stepIndex]

  const suggestions = useMemo(
    () => (currentStep ? findDurations(currentStep).slice(0, 3) : []),
    [currentStep]
  )

  // Keep the screen awake while cooking — hands are usually busy.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined

    let released = false

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Denied or unsupported; cooking still works, the screen just dims.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps))
  }, [totalSteps])

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        navigate(`/recipe/${id}`)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, navigate, id])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return

    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < 60) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const startCustomTimer = (minutes) => {
    const value = Number(minutes)
    if (!Number.isFinite(value) || value <= 0) return

    const seconds = Math.round(value * 60)
    addTimer(seconds, describeDuration(seconds))
    setShowTimerPicker(false)
    setCustomMinutes('')
  }

  if (loading) {
    return (
      <div className="cook-mode cook-mode-centered">
        <div className="loading-spinner"></div>
        <p>Loading recipe...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cook-mode cook-mode-centered">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="back-link">← Back to recipes</Link>
      </div>
    )
  }

  if (totalSteps === 0) {
    return (
      <div className="cook-mode cook-mode-centered">
        <h2>No steps to cook</h2>
        <p>This recipe doesn't have any instructions saved yet.</p>
        <Link to={`/recipe/${id}`} className="back-link">← Back to the recipe</Link>
      </div>
    )
  }

  const progress = (Math.min(stepIndex, totalSteps) / totalSteps) * 100

  return (
    <div className="cook-mode">
      <header className="cook-header">
        <button
          type="button"
          className="cook-exit"
          onClick={() => navigate(`/recipe/${id}`)}
          aria-label="Exit cook mode"
        >
          ✕
        </button>

        <div className="cook-header-title">
          <span className="cook-recipe-name">{recipe.name}</span>
          <span className="cook-step-count">
            {isFinished ? 'Finished' : `Step ${stepIndex + 1} of ${totalSteps}`}
          </span>
        </div>

        <button
          type="button"
          className={`cook-ingredients-toggle ${showIngredients ? 'active' : ''}`}
          onClick={() => setShowIngredients((v) => !v)}
        >
          Ingredients
        </button>
      </header>

      <div className="cook-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="cook-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {showIngredients && (
        <div className="cook-ingredients-drawer">
          <h3>Ingredients</h3>
          {recipe.ingredients?.length > 0 ? (
            <ul>
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  <strong>{[ing.amount, ing.unit].filter(Boolean).join(' ')}</strong> {ing.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cook-empty-note">No ingredients recorded for this recipe.</p>
          )}
        </div>
      )}

      <main
        className="cook-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isFinished ? (
          <div className="cook-done">
            <span className="cook-done-icon">🍽️</span>
            <h2>All done!</h2>
            <p>{recipe.name} is ready.</p>
            <div className="cook-done-actions">
              <button type="button" className="btn-secondary" onClick={() => setStepIndex(0)}>
                Start over
              </button>
              <button type="button" className="btn-primary" onClick={() => navigate(`/recipe/${id}`)}>
                Back to recipe
              </button>
            </div>
          </div>
        ) : (
          <div className="cook-step" key={stepIndex}>
            <span className="cook-step-number">{stepIndex + 1}</span>
            <p className="cook-step-text">{currentStep}</p>
          </div>
        )}
      </main>

      {!isFinished && (
        <nav className="cook-nav">
          <button
            type="button"
            className="cook-arrow"
            onClick={goPrev}
            disabled={stepIndex === 0}
            aria-label="Previous step"
          >
            ←
          </button>

          <span className="cook-nav-hint">Swipe or use the arrows</span>

          <button
            type="button"
            className="cook-arrow cook-arrow-next"
            onClick={goNext}
            aria-label={stepIndex === totalSteps - 1 ? 'Finish' : 'Next step'}
          >
            →
          </button>
        </nav>
      )}

      <TimerBar
        timers={timers}
        suggestions={suggestions}
        onStart={addTimer}
        onToggle={togglePause}
        onAddMinute={addMinute}
        onRemove={removeTimer}
        onCustom={() => setShowTimerPicker(true)}
      />

      {showTimerPicker && (
        <div className="timer-picker-backdrop" onClick={() => setShowTimerPicker(false)}>
          <div className="timer-picker" onClick={(e) => e.stopPropagation()}>
            <h3>Set a timer</h3>
            <div className="timer-picker-presets">
              {PRESET_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className="timer-preset"
                  onClick={() => startCustomTimer(minutes)}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <form
              className="timer-picker-custom"
              onSubmit={(e) => {
                e.preventDefault()
                startCustomTimer(customMinutes)
              }}
            >
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={!customMinutes}>
                Start
              </button>
            </form>
            <button type="button" className="timer-picker-cancel" onClick={() => setShowTimerPicker(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CookModePage
