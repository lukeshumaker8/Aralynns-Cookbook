import Anthropic from '@anthropic-ai/sdk';

// Model used for every AI feature in the cookbook.
export const MODEL = 'claude-sonnet-5';

export const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(statusCode, body) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(body) };
}

let client = null;

/**
 * Returns a configured Anthropic client, or null when no key is set so the
 * caller can return a useful message instead of a stack trace.
 */
export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * The chat features cost money per request, so they sit behind a shared
 * passcode. Browsing recipes stays open to everyone.
 *
 * Returns null when the request may proceed, or a response object to return.
 */
export function checkPasscode(passcode) {
  const expected = process.env.CHAT_PASSCODE;

  if (!expected) {
    return json(503, {
      error: 'Chat is not configured yet. Set CHAT_PASSCODE in your environment variables.',
      code: 'not_configured',
    });
  }

  if (!passcode || passcode !== expected) {
    return json(401, { error: 'Incorrect passcode.', code: 'bad_passcode' });
  }

  return null;
}

/**
 * The recipe shape the AI is asked to produce, shared by the URL importer and
 * the chat tool so both write rows the database accepts.
 */
export const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Recipe name' },
    description: { type: 'string', description: 'One or two sentence description' },
    prep_time: { type: ['integer', 'null'], description: 'Prep time in whole minutes' },
    cook_time: { type: ['integer', 'null'], description: 'Cook time in whole minutes' },
    servings: { type: ['integer', 'null'], description: 'Number of servings the amounts are written for' },
    difficulty: { type: ['string', 'null'], enum: ['Easy', 'Medium', 'Hard', null] },
    meal_type: { type: ['string', 'null'], enum: ['Breakfast', 'Lunch', 'Dinner', 'To-Go', null] },
    cooking_method: { type: ['string', 'null'], enum: ['Oven', 'Stovetop', 'Slow Cooker', null] },
    ingredients: {
      type: 'array',
      description: 'Ingredients with amount, unit and name kept in separate fields',
      items: {
        type: 'object',
        properties: {
          amount: { type: 'string', description: 'e.g. "2" or "1 1/2". Empty string if not given.' },
          unit: { type: 'string', description: 'e.g. "cups", "tbsp", "g". Empty string if not given.' },
          name: { type: 'string', description: 'e.g. "all-purpose flour"' },
        },
        required: ['amount', 'unit', 'name'],
      },
    },
    instructions: {
      type: 'array',
      description: 'Ordered steps, one string per step. Include times and temperatures in the step text.',
      items: { type: 'string' },
    },
  },
  required: ['name', 'ingredients', 'instructions'],
};

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'To-Go'];
const COOKING_METHODS = ['Oven', 'Stovetop', 'Slow Cooker'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const toInt = (value) => {
  const n = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const oneOf = (value, allowed) => (allowed.includes(value) ? value : null);

/**
 * Coerces whatever the model produced into the exact shape the recipes table
 * expects. Never throws — anything unusable becomes null or an empty list.
 */
export function sanitizeRecipe(data, extra = {}) {
  const source = data && typeof data === 'object' ? data : {};

  return {
    name: String(source.name || '').trim() || 'Untitled Recipe',
    description: String(source.description || '').trim(),
    prep_time: toInt(source.prep_time),
    cook_time: toInt(source.cook_time),
    servings: toInt(source.servings),
    difficulty: oneOf(source.difficulty, DIFFICULTIES),
    meal_type: oneOf(source.meal_type, MEAL_TYPES),
    cooking_method: oneOf(source.cooking_method, COOKING_METHODS),
    ingredients: Array.isArray(source.ingredients)
      ? source.ingredients
          .map((ing) => ({
            amount: String(ing?.amount ?? '').trim(),
            unit: String(ing?.unit ?? '').trim(),
            name: String(ing?.name ?? '').trim(),
          }))
          .filter((ing) => ing.name)
      : [],
    instructions: Array.isArray(source.instructions)
      ? source.instructions
          .filter((step) => typeof step === 'string' && step.trim())
          .map((step) => step.trim())
      : [],
    ...extra,
  };
}

/**
 * Turns an SDK error into a message worth showing in the UI.
 */
export function describeError(error) {
  const status = error?.status;

  if (status === 401) return 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.';
  if (status === 429) return 'Rate limited by the Anthropic API. Wait a moment and try again.';
  if (status === 400 && /credit balance/i.test(error?.message || '')) {
    return 'Your Anthropic account is out of credits. Top up at console.anthropic.com.';
  }
  if (status >= 500) return 'The Anthropic API is having trouble. Try again shortly.';

  return error?.message || 'Something went wrong.';
}
