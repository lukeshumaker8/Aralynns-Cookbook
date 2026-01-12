import Anthropic from '@anthropic-ai/sdk';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' }),
      };
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
      };
    }

    const html = await response.text();

    // Limit HTML size to avoid token limits
    const truncatedHtml = html.slice(0, 50000);

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY in environment variables.' }),
      };
    }

    // Use Claude to extract recipe data
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Extract the recipe information from this HTML page. Return ONLY valid JSON with no other text.

The JSON must have this exact structure:
{
  "name": "Recipe name",
  "description": "Brief description of the recipe",
  "prep_time": 15,
  "cook_time": 30,
  "difficulty": "Easy",
  "meal_type": "Dinner",
  "cooking_method": "Oven",
  "ingredients": [
    {"amount": "2", "unit": "cups", "name": "flour"},
    {"amount": "1", "unit": "tsp", "name": "salt"}
  ],
  "instructions": [
    "First step description",
    "Second step description"
  ]
}

Rules:
- prep_time and cook_time should be integers representing minutes
- difficulty must be one of: "Easy", "Medium", "Hard"
- meal_type must be one of: "Breakfast", "Lunch", "Dinner", "To-Go"
- cooking_method must be one of: "Oven", "Stovetop", "Slow Cooker"
- If you can't determine a value, use null
- For ingredients, separate the amount, unit, and name
- Instructions should be an array of strings, one per step
- Only extract information that is clearly present, don't make up data

HTML content:
${truncatedHtml}`,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].text;

    // Try to extract JSON from the response
    let recipeData;
    try {
      // First try direct parse
      recipeData = JSON.parse(responseText);
    } catch {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract recipe data from response');
      }
    }

    // Validate and sanitize the data
    const sanitized = {
      name: recipeData.name || 'Untitled Recipe',
      description: recipeData.description || '',
      prep_time: typeof recipeData.prep_time === 'number' ? recipeData.prep_time : null,
      cook_time: typeof recipeData.cook_time === 'number' ? recipeData.cook_time : null,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(recipeData.difficulty) ? recipeData.difficulty : null,
      meal_type: ['Breakfast', 'Lunch', 'Dinner', 'To-Go'].includes(recipeData.meal_type) ? recipeData.meal_type : null,
      cooking_method: ['Oven', 'Stovetop', 'Slow Cooker'].includes(recipeData.cooking_method) ? recipeData.cooking_method : null,
      ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients.map(ing => ({
        amount: String(ing.amount || ''),
        unit: String(ing.unit || ''),
        name: String(ing.name || ''),
      })).filter(ing => ing.name) : [],
      instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions.filter(inst => typeof inst === 'string' && inst.trim()) : [],
      recipe_url: url,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sanitized),
    };
  } catch (error) {
    console.error('Error importing recipe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to import recipe' }),
    };
  }
}
