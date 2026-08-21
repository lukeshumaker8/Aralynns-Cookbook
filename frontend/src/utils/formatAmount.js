// Shared parsing and display of ingredient quantities.
//
// The recipe page, the Cook Mode ingredients drawer and the shopping list all
// used to render amounts differently — one scaled and rounded, two printed the
// raw database string. Everything goes through here now.
//
// The important rule: parse to a NUMBER, do all arithmetic on the number, and
// format only at the render boundary. The old code scaled strings and then ran
// parseFloat over the result, so "1 1/2" silently became 1 on the way into unit
// conversion.

const UNICODE_FRACTIONS = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

// Only fractions a cook can actually measure, largest denominator last so the
// simplest match wins a tie.
const DISPLAY_FRACTIONS = [
  [1 / 2, '½'],
  [1 / 3, '⅓'],
  [2 / 3, '⅔'],
  [1 / 4, '¼'],
  [3 / 4, '¾'],
  [1 / 8, '⅛'],
  [3 / 8, '⅜'],
  [5 / 8, '⅝'],
  [7 / 8, '⅞'],
]

// Tight enough that nearby-but-different values keep their real quantity:
// 0.35 stays "0.35" rather than rounding up into "1/3" and quietly lying by 5%.
const FRACTION_TOLERANCE = 0.01

const UNICODE_CLASS = Object.keys(UNICODE_FRACTIONS).join('')

/**
 * Reads a written amount into a number.
 *
 * Handles "2", "2.5", "1 1/2", "3/4", "1½", "½", and tolerates surrounding
 * whitespace. Returns null for anything non-numeric ("a pinch", "to taste",
 * "", null) so callers can fall back to showing the original words.
 */
export function parseAmount(input) {
  if (input === null || input === undefined) return null

  const text = String(input).trim()
  if (!text) return null

  // Whole number or decimal followed by a unicode fraction, e.g. "1½"
  const mixedUnicode = text.match(new RegExp(`^(\\d+)\\s*([${UNICODE_CLASS}])$`))
  if (mixedUnicode) {
    return parseInt(mixedUnicode[1], 10) + UNICODE_FRACTIONS[mixedUnicode[2]]
  }

  // Bare unicode fraction, e.g. "½"
  if (text.length === 1 && UNICODE_FRACTIONS[text] !== undefined) {
    return UNICODE_FRACTIONS[text]
  }

  // Mixed ASCII number, e.g. "1 1/2"
  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) {
    const denominator = parseInt(mixed[3], 10)
    if (denominator === 0) return null
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / denominator
  }

  // Simple ASCII fraction, e.g. "3/4"
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fraction) {
    const denominator = parseInt(fraction[2], 10)
    if (denominator === 0) return null
    return parseInt(fraction[1], 10) / denominator
  }

  // Plain number. Rejects "2 cups" and "a pinch" — the whole string must be
  // numeric, unlike parseFloat which would happily return 2.
  if (/^\d+(\.\d+)?$/.test(text)) {
    return parseFloat(text)
  }

  return null
}

/**
 * Renders a number as a cook-readable amount: "2", "1½", "¾", "0.35".
 *
 * Falls back to a decimal rather than snapping to a fraction it isn't close
 * to, so the displayed quantity never lies about the arithmetic.
 */
export function formatAmount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return ''

  const rounded = Math.round(value * 1000) / 1000

  if (Number.isInteger(rounded)) return String(rounded)

  const whole = Math.floor(rounded)
  const remainder = rounded - whole

  let best = null
  let bestError = Infinity

  for (const [fractionValue, glyph] of DISPLAY_FRACTIONS) {
    const error = Math.abs(remainder - fractionValue)
    if (error < bestError) {
      bestError = error
      best = glyph
    }
  }

  if (bestError <= FRACTION_TOLERANCE) {
    return whole > 0 ? `${whole}${best}` : best
  }

  // Not near a usable fraction — show a short decimal instead of pretending.
  return String(Math.round(rounded * 100) / 100)
}

/**
 * Convenience for display-only surfaces (Cook Mode drawer, shopping list):
 * pretty-print a stored amount, leaving unparseable text exactly as written.
 */
export function formatRawAmount(input) {
  const value = parseAmount(input)
  if (value === null) return input == null ? '' : String(input)
  return formatAmount(value)
}

/**
 * Joins an amount and unit for display, dropping empty parts.
 */
export function formatQuantity(amount, unit) {
  return [formatRawAmount(amount), unit].filter((part) => part && String(part).trim()).join(' ')
}
