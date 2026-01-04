const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/cookbook.db');
const dataDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Sample recipes data
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
        name: 'Classic Beef Lasagna',
        description: 'Layers of pasta, rich meat sauce, creamy ricotta, and melted mozzarella baked to perfection.',
        image_url: '/images/beef-lasagna.jpg',
        prep_time: 30,
        cook_time: 60,
        servings: 8,
        difficulty: 'Medium',
        meal_type: 'Dinner',
        cooking_method: 'Oven',
        ingredients: [
            { name: 'Lasagna noodles', amount: '12', unit: 'sheets' },
            { name: 'Ground beef', amount: '1', unit: 'lb' },
            { name: 'Ricotta cheese', amount: '15', unit: 'oz' },
            { name: 'Mozzarella cheese', amount: '4', unit: 'cups' },
            { name: 'Parmesan cheese', amount: '1', unit: 'cup' },
            { name: 'Marinara sauce', amount: '24', unit: 'oz' },
            { name: 'Egg', amount: '1', unit: 'large' },
            { name: 'Italian seasoning', amount: '2', unit: 'tsp' }
        ],
        instructions: [
            'Preheat oven to 375°F (190°C).',
            'Cook lasagna noodles according to package directions.',
            'Brown ground beef in a skillet, drain fat, and mix with marinara sauce.',
            'Mix ricotta, egg, half the mozzarella, and Italian seasoning.',
            'Layer in a 9x13 baking dish: sauce, noodles, ricotta mixture, repeat.',
            'Top with remaining mozzarella and parmesan.',
            'Cover with foil and bake 45 minutes, then uncover and bake 15 more minutes.',
            'Let rest 10 minutes before serving.'
        ],
        tags: ['Italian', 'Pasta', 'Comfort Food']
    },
    {
        name: 'Chicken Stir Fry',
        description: 'A quick and colorful stir fry with tender chicken and crisp vegetables in a savory sauce.',
        image_url: '/images/chicken-stir-fry.jpg',
        prep_time: 15,
        cook_time: 10,
        servings: 4,
        difficulty: 'Easy',
        meal_type: 'Dinner',
        cooking_method: 'Stovetop',
        ingredients: [
            { name: 'Chicken breast', amount: '1', unit: 'lb' },
            { name: 'Broccoli florets', amount: '2', unit: 'cups' },
            { name: 'Bell peppers', amount: '2', unit: 'medium' },
            { name: 'Soy sauce', amount: '3', unit: 'tbsp' },
            { name: 'Sesame oil', amount: '2', unit: 'tbsp' },
            { name: 'Ginger', amount: '1', unit: 'tbsp' },
            { name: 'Garlic', amount: '3', unit: 'cloves' },
            { name: 'Cornstarch', amount: '1', unit: 'tbsp' }
        ],
        instructions: [
            'Cut chicken into bite-sized pieces and season with salt.',
            'Mix soy sauce, sesame oil, ginger, garlic, and cornstarch for the sauce.',
            'Heat a wok or large skillet over high heat with oil.',
            'Cook chicken until golden, about 5 minutes. Remove and set aside.',
            'Stir fry vegetables for 3-4 minutes until crisp-tender.',
            'Return chicken to wok, add sauce, and toss until coated.',
            'Serve over rice or noodles.'
        ],
        tags: ['Asian', 'Quick', 'Healthy']
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
    },
    {
        name: 'Slow Cooker Beef Stew',
        description: 'Hearty and comforting beef stew with tender meat and vegetables, slow-cooked to perfection.',
        image_url: '/images/beef-stew.jpg',
        prep_time: 20,
        cook_time: 480,
        servings: 6,
        difficulty: 'Easy',
        meal_type: 'Dinner',
        cooking_method: 'Slow Cooker',
        ingredients: [
            { name: 'Beef chuck', amount: '2', unit: 'lbs' },
            { name: 'Potatoes', amount: '4', unit: 'medium' },
            { name: 'Carrots', amount: '4', unit: 'large' },
            { name: 'Onion', amount: '1', unit: 'large' },
            { name: 'Beef broth', amount: '4', unit: 'cups' },
            { name: 'Tomato paste', amount: '2', unit: 'tbsp' },
            { name: 'Worcestershire sauce', amount: '2', unit: 'tbsp' },
            { name: 'Thyme', amount: '1', unit: 'tsp' }
        ],
        instructions: [
            'Cut beef into 1-inch cubes and season with salt and pepper.',
            'Brown beef in a skillet over high heat (optional but recommended).',
            'Cut potatoes, carrots, and onion into chunks.',
            'Place vegetables in slow cooker, add beef on top.',
            'Mix broth, tomato paste, Worcestershire, and thyme, pour over meat.',
            'Cook on low for 8 hours or high for 4 hours.',
            'Adjust seasoning and serve with crusty bread.'
        ],
        tags: ['Comfort Food', 'Beef', 'Slow Cooker']
    }
];

async function initDatabase() {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);

    // Insert sample data
    for (const recipe of sampleRecipes) {
        db.run(
            `INSERT INTO recipes (name, description, image_url, prep_time, cook_time, servings, difficulty, meal_type, cooking_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [recipe.name, recipe.description, recipe.image_url, recipe.prep_time, recipe.cook_time, recipe.servings, recipe.difficulty, recipe.meal_type, recipe.cooking_method]
        );

        const recipeIdResult = db.exec('SELECT last_insert_rowid() as id');
        const recipeId = recipeIdResult[0].values[0][0];

        for (const ingredient of recipe.ingredients) {
            db.run(
                'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
                [recipeId, ingredient.name, ingredient.amount, ingredient.unit]
            );
        }

        recipe.instructions.forEach((instruction, index) => {
            db.run(
                'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
                [recipeId, index + 1, instruction]
            );
        });

        for (const tag of recipe.tags) {
            db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tag]);
            db.run(
                'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))',
                [recipeId, tag]
            );
        }
    }

    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('Database initialized with sample recipes!');
    db.close();
}

initDatabase().catch(console.error);
