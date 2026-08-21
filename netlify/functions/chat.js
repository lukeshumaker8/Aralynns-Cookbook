import { getDatabase } from './lib/db.js';
import {
  MODEL,
  RECIPE_SCHEMA,
  checkPasscode,
  describeError,
  getClient,
  json,
  jsonHeaders,
  sanitizeRecipe,
} from './lib/ai.js';

// Keeps one conversation from growing without bound.
const MAX_HISTORY = 24;

const CREATE_RECIPE_TOOL = {
  name: 'create_recipe',
  description:
    'Draft a complete recipe and show it to the user as a save-able card. ' +
    'Call this whenever the user asks you to create, invent, write up, adapt, ' +
    'or add a recipe. Do not call it just to discuss or explain an existing recipe.',
  input_schema: RECIPE_SCHEMA,
};

function buildRecipeSystemPrompt(recipe, currentStep) {
  const ingredients = recipe.ingredients
    .map((i) => `- ${[i.amount, i.unit, i.name].filter(Boolean).join(' ')}`)
    .join('\n');

  const instructions = recipe.instructions
    .map((s, i) => `${i + 1}. ${s.instruction}`)
    .join('\n');

  return `You are the cooking assistant built into Aralynn's Cookbook. The user is looking at one specific recipe and asking about it.

<recipe>
Name: ${recipe.name}
Description: ${recipe.description || '(none)'}
Prep time: ${recipe.prep_time ?? 'unknown'} min
Cook time: ${recipe.cook_time ?? 'unknown'} min
Servings: ${recipe.servings ?? 'unknown'}
Difficulty: ${recipe.difficulty || 'unknown'}
Meal type: ${recipe.meal_type || 'unknown'}
Cooking method: ${recipe.cooking_method || 'unknown'}

Ingredients:
${ingredients || '(none recorded)'}

Instructions:
${instructions || '(none recorded)'}
</recipe>

${
  currentStep
    ? `The user is cooking right now and is on step ${currentStep.number} of ${currentStep.total}:
"${currentStep.text}"

Assume any vague question ("how long?", "how do I know when it's ready?", "can I skip this?") is about that step unless they clearly mean something else. Answer fast and short — their hands are busy.

`
    : ''
}Answer questions about this recipe: substitutions, scaling, technique, timing, storage, what to serve alongside it, why a step matters. Use the recipe above as the source of truth — if the user asks about something it does not cover, say so rather than inventing detail about their version.

If the user asks you to create a new recipe (a variation, a side dish, anything), call the create_recipe tool so they can save it to the cookbook with one tap.

Keep answers short and practical — this is read on a phone in a kitchen. A sentence or two for simple questions. Use plain prose, not headers. No preamble.`;
}

function buildCookbookSystemPrompt(recipes) {
  const list = recipes
    .map((r) => {
      const bits = [
        r.meal_type,
        r.difficulty,
        r.total_time ? `${r.total_time} min total` : null,
        r.cooking_method,
      ]
        .filter(Boolean)
        .join(', ');
      return `- [${r.name}](/recipe/${r.id})${bits ? ` — ${bits}` : ''}${
        r.description ? `. ${r.description}` : ''
      }`;
    })
    .join('\n');

  return `You are the cooking assistant built into Aralynn's Cookbook. You can see every recipe currently saved in the cookbook.

<cookbook>
${list || '(the cookbook is empty)'}
</cookbook>

Help the user find something to cook, compare recipes, plan meals, work out what they can make from ingredients they have, and answer general cooking questions.

When you mention a saved recipe, link it using exactly the markdown link shown in the list above, for example [Philly Cheesesteak](/recipe/3). Only link recipes that appear in the list — never invent an id.

The list above has names and summaries only, not full ingredients or steps. If the user needs that level of detail, point them at the recipe page and offer to answer more once they open it.

If the user asks you to create a new recipe, call the create_recipe tool so they can save it with one tap.

Keep answers short and practical — this is read on a phone. Plain prose, no headers, no preamble.`;
}

async function loadRecipe(db, recipeId) {
  const recipeResult = await db.execute({
    sql: 'SELECT * FROM recipes WHERE id = ?',
    args: [recipeId],
  });

  if (recipeResult.rows.length === 0) return null;

  const [ingredientsResult, instructionsResult] = await Promise.all([
    db.execute({
      sql: 'SELECT name, amount, unit FROM ingredients WHERE recipe_id = ?',
      args: [recipeId],
    }),
    db.execute({
      sql: 'SELECT step_number, instruction FROM instructions WHERE recipe_id = ? ORDER BY step_number',
      args: [recipeId],
    }),
  ]);

  return {
    ...recipeResult.rows[0],
    ingredients: ingredientsResult.rows,
    instructions: instructionsResult.rows,
  };
}

async function loadCookbook(db) {
  const result = await db.execute(
    'SELECT id, name, description, meal_type, difficulty, cooking_method, prep_time, cook_time FROM recipes ORDER BY created_at DESC'
  );

  return result.rows.map((r) => ({
    ...r,
    total_time: (r.prep_time || 0) + (r.cook_time || 0),
  }));
}

/**
 * Normalizes the client's history into Messages API shape and drops anything
 * that isn't a plain user/assistant text turn.
 */
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: String(m.content ?? '').slice(0, 8000) }))
    .filter((m) => m.content.trim())
    .slice(-MAX_HISTORY);
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  const { passcode, scope, recipeId } = body;

  const denied = checkPasscode(passcode);
  if (denied) return denied;

  // Lets the passcode form confirm the code without spending a model call.
  if (body.verifyOnly) return json(200, { ok: true });

  const client = getClient();
  if (!client) {
    return json(500, {
      error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment variables.',
      code: 'not_configured',
    });
  }

  const messages = normalizeMessages(body.messages);
  if (messages.length === 0) {
    return json(400, { error: 'No message to respond to.' });
  }

  try {
    const db = getDatabase();
    let system;

    if (scope === 'recipe') {
      const recipe = await loadRecipe(db, recipeId);
      if (!recipe) return json(404, { error: 'Recipe not found' });

      // Sent by Cook Mode so vague questions resolve against the visible step.
      const step = body.currentStep;
      const currentStep =
        step && typeof step.text === 'string' && step.text.trim()
          ? {
              number: Number(step.number) || 1,
              total: Number(step.total) || recipe.instructions.length,
              text: step.text.slice(0, 2000),
            }
          : null;

      system = buildRecipeSystemPrompt(recipe, currentStep);
    } else {
      system = buildCookbookSystemPrompt(await loadCookbook(db));
    }

    const request = {
      model: MODEL,
      // Thinking is adaptive by default on this model and shares the budget
      // with the reply, so leave headroom for a full recipe draft.
      max_tokens: 8192,
      // Kitchen questions are quick ones; low effort keeps latency down while
      // still leaving the model willing to reach for the recipe tool.
      output_config: { effort: 'low' },
      system,
      tools: [CREATE_RECIPE_TOOL],
      messages,
    };

    let response = await client.messages.create(request);
    let draftRecipe = null;

    // If the model drafted a recipe, hand the draft back as a tool result so it
    // can write a normal sentence introducing it, then return both.
    const toolUse = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'create_recipe'
    );

    if (toolUse) {
      draftRecipe = sanitizeRecipe(toolUse.input);

      response = await client.messages.create({
        ...request,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content:
                  'The recipe draft is now displayed to the user with a Save button. ' +
                  'Introduce it in one short sentence. Do not repeat the ingredients or steps.',
              },
            ],
          },
        ],
      });
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (response.stop_reason === 'refusal') {
      return json(200, {
        text: "I can't help with that one. Ask me something else about cooking.",
        recipe: null,
      });
    }

    return json(200, {
      text: text || (draftRecipe ? "Here's a recipe for that." : 'No response generated.'),
      recipe: draftRecipe,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return json(error?.status && error.status < 500 ? error.status : 500, {
      error: describeError(error),
    });
  }
}
