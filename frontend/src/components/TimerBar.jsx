import { formatDuration, describeDuration } from '../utils/timerParser'
import { remainingSeconds } from '../hooks/useTimers'

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/**
 * iOS has no public URL scheme for creating a Clock timer, so the hand-off goes
 * through the Shortcuts app. The user installs a one-line shortcut once; after
 * that this button starts a real system timer that rings even when the phone is
 * locked and the browser has been closed.
 */
export function iosTimerUrl(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(
    'Cookbook Timer'
  )}&input=text&text=${minutes}`
}

function TimerChip({ timer, onToggle, onAddMinute, onRemove }) {
  const remaining = remainingSeconds(timer)
  const isDone = remaining === 0 && timer.pausedRemaining == null
  const isPaused = timer.pausedRemaining != null
  const progress = timer.durationSeconds
    ? Math.min(100, ((timer.durationSeconds - remaining) / timer.durationSeconds) * 100)
    : 0

  return (
    <div className={`timer-chip ${isDone ? 'timer-chip-done' : ''} ${isPaused ? 'timer-chip-paused' : ''}`}>
      <div className="timer-chip-progress" style={{ width: `${progress}%` }} aria-hidden="true" />

      <div className="timer-chip-body">
        <div className="timer-chip-text">
          <span className="timer-chip-time">{isDone ? 'Done' : formatDuration(remaining)}</span>
          <span className="timer-chip-label">{timer.label}</span>
        </div>

        <div className="timer-chip-actions">
          {isDone ? (
            <button
              type="button"
              className="timer-chip-btn"
              onClick={() => onAddMinute(timer.id)}
              title="Add another minute"
            >
              +1m
            </button>
          ) : (
            <button
              type="button"
              className="timer-chip-btn"
              onClick={() => onToggle(timer.id)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? '▶' : '❚❚'}
            </button>
          )}
          <button
            type="button"
            className="timer-chip-btn timer-chip-close"
            onClick={() => onRemove(timer.id)}
            title="Dismiss timer"
            aria-label={`Dismiss ${timer.label}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function TimerBar({ timers, suggestions, onStart, onToggle, onAddMinute, onRemove, onCustom }) {
  const showIosHandoff = isIOS()

  return (
    <div className="timer-bar">
      {suggestions.length > 0 && (
        <div className="timer-suggestions">
          <span className="timer-suggestions-label">Timers for this step</span>
          <div className="timer-suggestions-row">
            {suggestions.map((suggestion) => (
              <div key={suggestion.seconds} className="timer-suggestion-group">
                <button
                  type="button"
                  className="timer-suggestion"
                  onClick={() => onStart(suggestion.seconds, suggestion.label)}
                >
                  <span className="timer-suggestion-icon">⏱</span>
                  {suggestion.label}
                </button>
                {showIosHandoff && (
                  <a
                    className="timer-ios-btn"
                    href={iosTimerUrl(suggestion.seconds)}
                    title={`Start a ${describeDuration(
                      suggestion.seconds
                    )} timer in the iPhone Clock app (requires the Cookbook Timer shortcut)`}
                  >

                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="timer-active-row">
        {timers.map((timer) => (
          <TimerChip
            key={timer.id}
            timer={timer}
            onToggle={onToggle}
            onAddMinute={onAddMinute}
            onRemove={onRemove}
          />
        ))}

        <button type="button" className="timer-custom-btn" onClick={onCustom}>
          + Timer
        </button>
      </div>
    </div>
  )
}

export default TimerBar
