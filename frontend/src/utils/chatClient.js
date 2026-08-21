// The AI chat costs money per message, so it sits behind a shared passcode.
// The passcode is checked on the server; this module just remembers it.

const STORAGE_KEY = 'cookbook-chat-passcode'

export function getPasscode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setPasscode(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Private browsing — the passcode just won't persist across reloads.
  }
}

export function clearPasscode() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do.
  }
}

export class ChatError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ChatError'
    this.code = code
  }
}

/**
 * Sends a conversation to the chat function.
 *
 * @returns {Promise<{ text: string, recipe: object|null }>}
 */
export async function sendChat({ scope, recipeId, messages, passcode }) {
  let res
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, recipeId, messages, passcode: passcode ?? getPasscode() }),
    })
  } catch {
    throw new ChatError('Could not reach the server. Check your connection.', 'network')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new ChatError('The server returned an unreadable response.', 'bad_response')
  }

  if (!res.ok) {
    throw new ChatError(data.error || 'Chat failed.', data.code || String(res.status))
  }

  return data
}

/**
 * Checks a passcode without spending a model call, so the unlock form can
 * reject a wrong code immediately instead of failing on the first message.
 */
export async function verifyPasscode(passcode) {
  let res
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifyOnly: true, passcode }),
    })
  } catch {
    throw new ChatError('Could not reach the server. Check your connection.', 'network')
  }

  if (res.ok) return true

  const data = await res.json().catch(() => ({}))
  throw new ChatError(data.error || 'Could not verify that passcode.', data.code || String(res.status))
}

/**
 * Saves an AI-drafted recipe through the existing recipes endpoint.
 *
 * @returns {Promise<number>} the new recipe id
 */
export async function saveRecipe(recipe) {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || 'Failed to save the recipe.')
  }

  return data.id
}
