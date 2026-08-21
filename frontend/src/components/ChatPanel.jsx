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

function RecipeDraftCard({ recipe }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)

    try {
      const newId = await saveRecipe(recipe)
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
      <div className="chat-draft-header">
        <span className="chat-draft-badge">New recipe</span>
        <h4>{recipe.name}</h4>
        {meta.length > 0 && <p className="chat-draft-meta">{meta.join(' · ')}</p>}
      </div>

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

function PasscodeGate({ onUnlock }) {
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
        />
        <button type="submit" className="btn-primary" disabled={checking || !value.trim()}>
          {checking ? 'Checking...' : 'Unlock'}
        </button>
      </div>
      {error && <div className="chat-error">{error}</div>}
    </form>
  )
}

/**
 * The chat surface used on both the recipe page and the home page. The only
 * differences are the scope sent to the server and the placeholder text.
 */
function ChatPanel({ scope, recipeId, title, placeholder, suggestions = [] }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [locked, setLocked] = useState(() => !getPasscode())

  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const send = async (text, passcodeOverride) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const history = [...messages, { role: 'user', content: trimmed }]
    setMessages(history)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const data = await sendChat({
        scope,
        recipeId,
        passcode: passcodeOverride,
        messages: history.map(({ role, content }) => ({ role, content })),
      })

      setMessages([...history, { role: 'assistant', content: data.text, recipe: data.recipe }])
    } catch (err) {
      if (err instanceof ChatError && err.code === 'bad_passcode') {
        // The passcode changed on the server since we last unlocked.
        clearPasscode()
        setLocked(true)
        setMessages(messages)
      } else {
        setError(err.message)
        setMessages(messages)
      }
      setInput(trimmed)
    } finally {
      setSending(false)
    }
  }

  const handleUnlock = (passcode) => {
    setPasscode(passcode)
    setLocked(false)
  }

  if (locked) {
    return (
      <section className="chat-panel">
        <h2 className="chat-title">{title}</h2>
        <PasscodeGate onUnlock={handleUnlock} />
      </section>
    )
  }

  return (
    <section className="chat-panel">
      <div className="chat-header">
        <h2 className="chat-title">{title}</h2>
        {messages.length > 0 && (
          <button type="button" className="chat-clear" onClick={() => setMessages([])}>
            Clear
          </button>
        )}
      </div>

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
              {message.recipe && <RecipeDraftCard recipe={message.recipe} />}
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

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={sending}
        />
        <button type="submit" className="chat-send" disabled={sending || !input.trim()} aria-label="Send">
          {sending ? '…' : '↑'}
        </button>
      </form>
    </section>
  )
}

export default ChatPanel
