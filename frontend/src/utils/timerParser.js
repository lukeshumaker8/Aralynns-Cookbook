// Finds cook times written into instruction text so Cook Mode can offer a
// one-tap timer for each one ("Bake for 25-30 minutes" -> a 25:00 timer).

const UNIT_SECONDS = {
  second: 1,
  seconds: 1,
  sec: 1,
  secs: 1,
  minute: 60,
  minutes: 60,
  min: 60,
  mins: 60,
  hour: 3600,
  hours: 3600,
  hr: 3600,
  hrs: 3600,
}

// Fractions and spelled-out numbers that show up in recipe steps.
const WORD_NUMBERS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  sixty: 60,
  ninety: 90,
  half: 0.5,
}

const NUMBER_WORDS = Object.keys(WORD_NUMBERS).join('|')
const UNIT_WORDS = Object.keys(UNIT_SECONDS).join('|')

// "25", "1 1/2", "1.5", "3/4", or a spelled-out number.
const QUANTITY = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|${NUMBER_WORDS})`

// Matches an optional range ("25-30", "25 to 30") followed by a time unit.
const DURATION_RE = new RegExp(
  `\\b(${QUANTITY})\\s*(?:(?:-|–|—|\\s+to\\s+|\\s+or\\s+)\\s*(${QUANTITY}))?\\s*(${UNIT_WORDS})\\b`,
  'gi'
)

function parseQuantity(raw) {
  if (!raw) return null

  const text = raw.toLowerCase().trim()

  if (Object.prototype.hasOwnProperty.call(WORD_NUMBERS, text)) {
    return WORD_NUMBERS[text]
  }

  // Mixed number, e.g. "1 1/2"
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10)
  }

  const fraction = text.match(/^(\d+)\/(\d+)$/)
  if (fraction) {
    return parseInt(fraction[1], 10) / parseInt(fraction[2], 10)
  }

  const num = parseFloat(text)
  return Number.isFinite(num) ? num : null
}

/**
 * Formats seconds as a clock string: 90 -> "1:30", 3900 -> "1:05:00".
 */
export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  const pad = (n) => String(n).padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`
}

/**
 * A short human label for a duration, e.g. "25 min", "1 hr 30 min".
 */
export function describeDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))

  if (safe < 60) return `${safe} sec`

  if (safe < 3600) {
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`
  }

  const hours = Math.floor(safe / 3600)
  const minutes = Math.round((safe % 3600) / 60)

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
}

/**
 * Pulls every timeable duration out of a step.
 *
 * Ranges resolve to the lower bound, because that is when a cook should first
 * check the food. The original wording is kept in `label` so the button still
 * reads "25-30 minutes".
 *
 * Returns [{ seconds, label, index }], deduplicated, longest first.
 */
// Phrases where the number and the unit are not adjacent, so the main pattern
// would read "half an hour" as "an hour". Rewritten before matching.
const PHRASE_REWRITES = [
  [/\ban?\s+hour\s+and\s+a\s+half\b/gi, '90 minutes'],
  [/\bhalf\s+an?\s+hour\b/gi, '30 minutes'],
  [/\bquarter\s+of\s+an?\s+hour\b/gi, '15 minutes'],
  [/\bhalf\s+a\s+minute\b/gi, '30 seconds'],
]

function normalize(text) {
  return PHRASE_REWRITES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text
  )
}

export function findDurations(text) {
  if (!text || typeof text !== 'string') return []

  const normalized = normalize(text)
  const found = []
  const seen = new Set()

  for (const match of normalized.matchAll(DURATION_RE)) {
    const [raw, first, second, unit] = match

    const low = parseQuantity(first)
    if (low === null) continue

    const unitSeconds = UNIT_SECONDS[unit.toLowerCase()]
    const seconds = Math.round(low * unitSeconds)

    // Ignore nonsense and anything too long to sit and watch.
    if (seconds < 5 || seconds > 8 * 3600) continue
    if (seen.has(seconds)) continue

    seen.add(seconds)

    const high = parseQuantity(second)
    const label = high !== null && high !== low
      ? `${raw.trim()}`
      : describeDuration(seconds)

    found.push({ seconds, label: label.trim(), index: match.index })
  }

  return found.sort((a, b) => b.seconds - a.seconds)
}
