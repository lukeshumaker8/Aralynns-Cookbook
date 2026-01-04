import { getDatabase, MEAL_TYPES, COOKING_METHODS, DIFFICULTIES } from './lib/db.js';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const db = getDatabase();
  const path = event.path.replace('/.netlify/functions/recipes', '').replace('/api/recipes', '');

  try {
    // GET /api/recipes/filters/options
    if (path === '/filters/options' && event.httpMethod === 'GET') {
      const tagsResult = await db.execute('SELECT name FROM tags ORDER BY name');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          meal_types: MEAL_TYPES,
          difficulties: DIFFICULTIES,
          cooking_methods: COOKING_METHODS,
          tags: tagsResult.rows.map(t => t.name),
        }),
      };
    }

    // GET /api/recipes/:id
    if (path.match(/^\/\d+$/) && event.httpMethod === 'GET') {
      const id = path.slice(1);

      const recipeResult = await db.execute({
        sql: `
          SELECT r.*, GROUP_CONCAT(DISTINCT t.name) as tags
          FROM recipes r
          LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
          LEFT JOIN tags t ON rt.tag_id = t.id
          WHERE r.id = ?
          GROUP BY r.id
        `,
        args: [id],
      });

      if (recipeResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Recipe not found' }),
        };
      }

      const recipe = recipeResult.rows[0];

      const ingredientsResult = await db.execute({
        sql: 'SELECT name, amount, unit FROM ingredients WHERE recipe_id = ?',
        args: [id],
      });

      const instructionsResult = await db.execute({
        sql: 'SELECT step_number, instruction FROM instructions WHERE recipe_id = ? ORDER BY step_number',
        args: [id],
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...recipe,
          tags: recipe.tags ? recipe.tags.split(',') : [],
          total_time: (recipe.prep_time || 0) + (recipe.cook_time || 0),
          ingredients: ingredientsResult.rows,
          instructions: instructionsResult.rows,
        }),
      };
    }

    // GET /api/recipes
    if ((path === '' || path === '/') && event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const { meal_type, difficulty, cooking_method, search } = params;

      let sql = `
        SELECT r.*, GROUP_CONCAT(DISTINCT t.name) as tags
        FROM recipes r
        LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
        LEFT JOIN tags t ON rt.tag_id = t.id
        WHERE 1=1
      `;
      const args = [];

      if (meal_type) {
        sql += ' AND r.meal_type = ?';
        args.push(meal_type);
      }

      if (difficulty) {
        sql += ' AND r.difficulty = ?';
        args.push(difficulty);
      }

      if (cooking_method) {
        sql += ' AND r.cooking_method = ?';
        args.push(cooking_method);
      }

      if (search) {
        sql += ' AND (r.name LIKE ? OR r.description LIKE ?)';
        args.push(`%${search}%`, `%${search}%`);
      }

      sql += ' GROUP BY r.id ORDER BY r.created_at DESC';

      const result = await db.execute({ sql, args });

      const recipes = result.rows.map(recipe => ({
        ...recipe,
        tags: recipe.tags ? recipe.tags.split(',') : [],
        total_time: (recipe.prep_time || 0) + (recipe.cook_time || 0),
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(recipes),
      };
    }

    // POST /api/recipes
    if ((path === '' || path === '/') && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const {
        name,
        description,
        image_url,
        prep_time,
        cook_time,
        servings,
        difficulty,
        meal_type,
        cooking_method,
        recipe_url,
        ingredients,
        instructions,
      } = body;

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Recipe name is required' }),
        };
      }

      const result = await db.execute({
        sql: `
          INSERT INTO recipes (name, description, image_url, prep_time, cook_time, servings, difficulty, meal_type, cooking_method, recipe_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          name,
          description || null,
          image_url || null,
          prep_time || null,
          cook_time || null,
          servings || null,
          difficulty || null,
          meal_type || null,
          cooking_method || null,
          recipe_url || null,
        ],
      });

      const recipeId = result.lastInsertRowid;

      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await db.execute({
            sql: 'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
            args: [recipeId, ingredient.name, ingredient.amount || '', ingredient.unit || ''],
          });
        }
      }

      if (instructions && instructions.length > 0) {
        for (let i = 0; i < instructions.length; i++) {
          await db.execute({
            sql: 'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
            args: [recipeId, i + 1, instructions[i]],
          });
        }
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ id: Number(recipeId), message: 'Recipe created successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
