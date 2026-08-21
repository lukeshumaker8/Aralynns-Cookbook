import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChatError,
  clearPasscode,
  getPasscode,
  saveRecipe,
  sendChat,
  setPasscode,
  verifyPasscode,
} from '../utils/chatClient'

const LINK_RE = /\[([^\]]+)\]\(\/recipe\/(\d+)\)/g
const BOLD_RE = /\*\*([^*]+)\*\*/g

/**
 * Renders assistant text with the two bits of markdown the prompts actually
 * produce: internal recipe links and bold. Everything else stays literal, so
 * there is no HTML injection surface.
 */
function renderMessage(text) {
  return text.split('\n').map((line, lineIndex) => {
    const nodes = []
    let cursor = 0

    LINK_RE.lastIndex = 0
    let match = LINK_RE.exec(line)

    while (match) {
      if (match.index > cursor) nodes.push(line.slice(cursor, match.index))
      nodes.push(
        <Link key={`${lineIndex}-${match.index}`} to={`/recipe/${match[2]}`} className="chat-recipe-link">
          {match[1]}
        </Link>
      )
      cursor = match.index + match[0].length
      match = LINK_RE.exec(line)
    }

    if (cursor < line.length) nodes.push(line.slice(cursor))

    const withBold = nodes.map((node, i) => {
      if (typeof node !== 'string') return node

      const parts = node.split(BOLD_RE)
      return parts.map((part, partIndex) =>
        partIndex % 2 === 1 ? <strong key={`${i}-${partIndex}`}>{part}</strong> : part
      )
    })

    return (
      <span key={lineIndex} className="chat-line">
        {withBold}
      </span>
    )
  })
}

function RecipeDraftCard({ recipe, onSaved }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)

    try {
      const newId = await saveRecipe(recipe)
      onSaved?.()
      navigate(`/recipe/${newId}`)
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  const meta = [
    recipe.prep_time ? `${recipe.prep_time} min prep` : null,
    recipe.cook_time ? `${recipe.cook_time} min cook` : null,
    recipe.difficulty,
    recipe.meal_type,
  ].filter(Boolean)

  return (
    <div className="chat-recipe-draft">
      <span className="chat-draft-badge">New recipe</span>
      <h4>{recipe.name}</h4>
      {meta.length > 0 && <p className="chat-draft-meta">{meta.join(' · ')}</p>}
      {recipe.description && <p className="chat-draft-description">{recipe.description}</p>}

      <details className="chat-draft-details">
        <summary>
          {recipe.ingredients.length} ingredients · {recipe.instructions.length} steps
        </summary>
        <ul className="chat-draft-ingredients">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              <strong>{[ing.amount, ing.unit].filter(Boolean).join(' ')}</strong> {ing.name}
            </li>
          ))}
        </ul>
        <ol className="chat-draft-steps">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </details>

      {saveError && <div className="chat-error">{saveError}</div>}

      <button type="button" className="btn-primary chat-draft-save" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save to cookbook'}
      </button>
    </div>
  )
}

function PasscodeForm({ onUnlock }) {
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()

    const passcode = value.trim()
    if (!passcode || checking) return

    setChecking(true)
    setError(null)

    try {
      await verifyPasscode(passcode)
      onUnlock(passcode)
    } catch (err) {
      setError(err.message)
      setChecking(false)
    }
  }

  return (
    <form className="chat-passcode" onSubmit={submit}>
      <span className="chat-passcode-icon">🔒</span>
      <p className="chat-passcode-text">Enter the passcode to use the AI assistant.</p>
      <div className="chat-passcode-row">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passcode"
          autoComplete="current-password"
          disabled={checking}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={checking || !value.trim()}>
          {checking ? '...' : 'Unlock'}
        </button>
      </div>
      {error && <div className="chat-error">{error}</div>}
    </form>
  )
}

/**
 * A compact chat bar pinned to the bottom of the viewport that expands into a
 * conversation sheet. Used on every normal page and inside Cook Mode.
 *
 * `variant` picks the palette: "light" for normal pages, "dark" for Cook Mode.
 * `getCurrentStep` lets Cook Mode tell the model which step is on screen.
 */
function ChatDock({
  scope,
  recipeId,
  placeholder = 'Ask the cookbook...',
  suggestions = [],
  variant = 'light',
  getCurrentStep,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(() => !getPasscode())

  const listRef = useRef(null)
  const inputRef = useRef(null)

  // A new recipe (or leaving one) means a different conversation subject.
  const contextKey = `${scope}:${recipeId ?? ''}`
  const previousKey = useRef(contextKey)

  useEffect(() => {
    if (previousKey.current !== contextKey) {
      previousKey.current = contextKey
      setMessages([])
      setError(null)
      setOpen(false)
    }
  }, [contextKey])

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, sending, open])

  // Escape closes the sheet, matching the rest of the app.
  useEffect(() => {
    if (!open) return undefined

    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const send = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    if (locked) {
      setOpen(true)
      return
    }

    const history = [...messages, { role: 'user', content: trimmed }]
    setMessages(history)
    setInput('')
    setSending(true)
    setError(null)
    setOpen(true)

    try {
      const data = await sendChat({
        scope,
        recipeId,
        currentStep: getCurrentStep?.() ?? undefined,
        messages: history.map(({ role, content }) => ({ role, content })),
      })

      setMessages([...history, { role: 'assistant', content: data.text, recipe: data.recipe }])
    } catch (err) {
      if (err instanceof ChatError && err.code === 'bad_passcode') {
        // The passcode changed on the server since we last unlocked.
        clearPasscode()
        setLocked(true)
      } else {
        setError(err.message)
      }
      setMessages(messages)
      setInput(trimmed)
    } finally {
      setSending(false)
    }
  }

  const handleUnlock = (passcode) => {
    setPasscode(passcode)
    setLocked(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const hasSheet = open && (locked || messages.length > 0 || suggestions.length > 0 || error)

  return (
    <>
      {/* Cook Mode docks the sheet into the layout, so it needs no scrim. */}
      {open && variant === 'light' && (
        <div className="chat-dock-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div className={`chat-dock chat-dock-${variant} ${open ? 'chat-dock-open' : ''}`}>
        {hasSheet && (
          <div className="chat-dock-sheet">
            <div className="chat-dock-sheet-head">
              <span className="chat-dock-scope">
                {scope === 'recipe' ? 'This recipe' : 'Whole cookbook'}
              </span>
              <div className="chat-dock-sheet-actions">
                {messages.length > 0 && (
                  <button type="button" className="chat-clear" onClick={() => setMessages([])}>
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="chat-dock-collapse"
                  onClick={() => setOpen(false)}
                  aria-label="Collapse chat"
                >
                  ⌄
                </button>
              </div>
            </div>

            {locked ? (
              <PasscodeForm onUnlock={handleUnlock} />
            ) : (
              <>
                {messages.length === 0 && suggestions.length > 0 && (
                  <div className="chat-suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="chat-suggestion"
                        onClick={() => send(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="chat-messages" ref={listRef}>
                    {messages.map((message, i) => (
                      <div key={i} className={`chat-message chat-message-${message.role}`}>
                        <div className="chat-bubble">{renderMessage(message.content)}</div>
                        {message.recipe && (
                          <RecipeDraftCard recipe={message.recipe} onSaved={() => setOpen(false)} />
                        )}
                      </div>
                    ))}

                    {sending && (
                      <div className="chat-message chat-message-assistant">
                        <div className="chat-bubble chat-thinking">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {error && <div className="chat-error">{error}</div>}
              </>
            )}
          </div>
        )}

        <form
          className="chat-dock-bar"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          {locked ? (
            <button type="button" className="chat-dock-locked" onClick={() => setOpen(true)}>
              <span className="chat-dock-lock-icon">🔒</span>
              Unlock the AI assistant
            </button>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                className="chat-dock-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                disabled={sending}
                aria-label="Ask the AI assistant"
              />
              <button
                type="submit"
                className="chat-dock-send"
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                {sending ? '…' : '↑'}
              </button>
            </>
          )}
        </form>
      </div>
    </>
  )
}

export default ChatDock
