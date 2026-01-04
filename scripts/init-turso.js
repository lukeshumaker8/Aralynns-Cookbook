import { createClient } from '@libsql/client';

// Run this script to initialize your Turso database
// Usage: TURSO_DATABASE_URL=your-url TURSO_AUTH_TOKEN=your-token node scripts/init-turso.js

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schema = `
-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
    meal_type TEXT,
    cooking_method TEXT,
    recipe_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount TEXT,
    unit TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Instructions table
CREATE TABLE IF NOT EXISTS instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Recipe-Tags junction table
CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
`;

const sampleRecipes = [
  {
    name: 'Philly Cheesesteak',
    description: 'A classic Philadelphia sandwich with thinly sliced beef, melted cheese, and sautéed onions on a hoagie roll.',
    image_url: '/images/philly-cheesesteak.jpg',
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    difficulty: 'Medium',
    meal_type: 'Dinner',
    cooking_method: 'Stovetop',
    ingredients: [
      { name: 'Ribeye steak', amount: '1.5', unit: 'lbs' },
      { name: 'Provolone cheese', amount: '8', unit: 'slices' },
      { name: 'Onion', amount: '1', unit: 'large' },
      { name: 'Green bell pepper', amount: '1', unit: 'medium' },
      { name: 'Hoagie rolls', amount: '4', unit: '' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp' },
      { name: 'Salt and pepper', amount: '', unit: 'to taste' }
    ],
    instructions: [
      'Freeze the ribeye for 30 minutes to make slicing easier, then slice very thin.',
      'Heat olive oil in a large skillet over medium-high heat.',
      'Add sliced onions and peppers, cook until softened, about 5 minutes. Set aside.',
      'In the same skillet, cook the sliced beef until browned, about 3-4 minutes.',
      'Season with salt and pepper, then add the onions and peppers back.',
      'Place provolone slices on top and let melt.',
      'Divide mixture among hoagie rolls and serve immediately.'
    ],
    tags: ['American', 'Sandwich', 'Beef']
  },
  {
    name: 'Honey Garlic Salmon',
    description: 'Tender salmon fillets glazed with a sweet and savory honey garlic sauce, perfect for a quick weeknight dinner.',
    image_url: '/images/honey-garlic-salmon.jpg',
    prep_time: 10,
    cook_time: 15,
    servings: 4,
    difficulty: 'Easy',
    meal_type: 'Dinner',
    cooking_method: 'Oven',
    ingredients: [
      { name: 'Salmon fillets', amount: '4', unit: '6oz pieces' },
      { name: 'Honey', amount: '3', unit: 'tbsp' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp' },
      { name: 'Garlic', amount: '4', unit: 'cloves' },
      { name: 'Lemon juice', amount: '1', unit: 'tbsp' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp' }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Mix honey, soy sauce, minced garlic, and lemon juice in a small bowl.',
      'Place salmon fillets on a lined baking sheet, brush with olive oil.',
      'Pour the honey garlic sauce over the salmon.',
      'Bake for 12-15 minutes until salmon flakes easily with a fork.',
      'Garnish with fresh parsley and serve.'
    ],
    tags: ['Seafood', 'Healthy', 'Quick']
  },
  {
    name: 'Blueberry Pancakes',
    description: 'Fluffy homemade pancakes bursting with fresh blueberries, perfect for a weekend breakfast.',
    image_url: '/images/blueberry-pancakes.jpg',
    prep_time: 10,
    cook_time: 15,
    servings: 4,
    difficulty: 'Easy',
    meal_type: 'Breakfast',
    cooking_method: 'Stovetop',
    ingredients: [
      { name: 'All-purpose flour', amount: '1.5', unit: 'cups' },
      { name: 'Milk', amount: '1.25', unit: 'cups' },
      { name: 'Egg', amount: '1', unit: 'large' },
      { name: 'Butter', amount: '3', unit: 'tbsp' },
      { name: 'Sugar', amount: '2', unit: 'tbsp' },
      { name: 'Baking powder', amount: '2', unit: 'tsp' },
      { name: 'Fresh blueberries', amount: '1', unit: 'cup' },
      { name: 'Vanilla extract', amount: '1', unit: 'tsp' }
    ],
    instructions: [
      'Mix flour, sugar, baking powder, and salt in a large bowl.',
      'Whisk milk, egg, melted butter, and vanilla in another bowl.',
      'Pour wet ingredients into dry and stir until just combined.',
      'Gently fold in blueberries.',
      'Heat a griddle over medium heat and grease lightly.',
      'Pour 1/4 cup batter per pancake and cook until bubbles form.',
      'Flip and cook until golden brown.',
      'Serve with maple syrup and extra blueberries.'
    ],
    tags: ['Breakfast', 'Sweet', 'Vegetarian']
  }
];

async function initDatabase() {
  console.log('Creating tables...');

  // Split and execute each statement
  const statements = schema.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await db.execute(statement);
    }
  }

  console.log('Tables created.');
  console.log('Inserting sample recipes...');

  for (const recipe of sampleRecipes) {
    // Insert recipe
    const result = await db.execute({
      sql: `INSERT INTO recipes (name, description, image_url, prep_time, cook_time, servings, difficulty, meal_type, cooking_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [recipe.name, recipe.description, recipe.image_url, recipe.prep_time, recipe.cook_time, recipe.servings, recipe.difficulty, recipe.meal_type, recipe.cooking_method]
    });

    const recipeId = result.lastInsertRowid;

    // Insert ingredients
    for (const ingredient of recipe.ingredients) {
      await db.execute({
        sql: 'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        args: [recipeId, ingredient.name, ingredient.amount, ingredient.unit]
      });
    }

    // Insert instructions
    for (let i = 0; i < recipe.instructions.length; i++) {
      await db.execute({
        sql: 'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
        args: [recipeId, i + 1, recipe.instructions[i]]
      });
    }

    // Insert tags
    for (const tag of recipe.tags) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)',
        args: [tag]
      });
      await db.execute({
        sql: 'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))',
        args: [recipeId, tag]
      });
    }

    console.log(`  Added: ${recipe.name}`);
  }

  console.log('Database initialized successfully!');
}

initDatabase().catch(console.error);
