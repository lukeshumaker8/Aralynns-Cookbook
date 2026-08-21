import {
  MODEL,
  RECIPE_SCHEMA,
  describeError,
  getClient,
  json,
  jsonHeaders,
  sanitizeRecipe,
} from './lib/ai.js';

// Enough of the page to reach the recipe without blowing past the token budget.
const MAX_HTML_CHARS = 60000;

const EXTRACT_TOOL = {
  name: 'extract_recipe',
  description: 'Record the recipe found on the page.',
  input_schema: RECIPE_SCHEMA,
};

/**
 * Strips the parts of a page that never contain recipe content. Cuts roughly
 * half the tokens on a typical food blog, which keeps more of the actual
 * recipe inside the character budget.
 */
function stripNoise(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return json(400, { error: 'URL is required' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return json(400, { error: 'That does not look like a valid web address.' });
    }

    const client = getClient();
    if (!client) {
      return json(500, {
        error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment variables.',
        code: 'not_configured',
      });
    }

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch {
      return json(400, { error: 'Could not reach that page. Check the link and try again.' });
    }

    if (!response.ok) {
      return json(400, {
        error: `That page returned ${response.status}. It may block automated access — try copying the recipe in manually.`,
      });
    }

    const html = stripNoise(await response.text()).slice(0, MAX_HTML_CHARS);

    // Forcing the tool guarantees a parseable object instead of prose that
    // happens to contain JSON.
    const message = await client.messages.create({
      model: MODEL,
      // A long recipe plus adaptive thinking needs room; running out mid-tool
      // would leave the arguments unparseable.
      max_tokens: 8192,
      output_config: { effort: 'medium' },
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_recipe' },
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this web page and record it with the extract_recipe tool.

Only record what the page actually states. Leave a field null when the page does not say — do not estimate times, difficulty, or servings. Keep each instruction step as its own string, and keep the times and temperatures inside the step text so a cook can follow them.

Page content:
${html}`,
        },
      ],
    });

    if (message.stop_reason === 'max_tokens') {
      return json(422, {
        error: 'That recipe was too long to import in one pass. Try a shorter recipe page, or enter it manually.',
      });
    }

    const toolUse = message.content.find((block) => block.type === 'tool_use');

    if (!toolUse) {
      return json(422, {
        error: 'No recipe found on that page. It may be a listing page rather than a single recipe.',
      });
    }

    const recipe = sanitizeRecipe(toolUse.input, { recipe_url: url });

    if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
      return json(422, {
        error: 'That page did not contain a readable recipe. Try the direct recipe link, or enter it manually.',
      });
    }

    return json(200, recipe);
  } catch (error) {
    console.error('Error importing recipe:', error);
    return json(error?.status && error.status < 500 ? error.status : 500, {
      error: describeError(error),
    });
  }
}
