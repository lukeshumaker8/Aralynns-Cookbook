-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    prep_time INTEGER,  -- in minutes
    cook_time INTEGER,  -- in minutes
    servings INTEGER,
    difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
    meal_type TEXT,     -- e.g., 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'
    cooking_method TEXT, -- e.g., 'Oven', 'Stovetop', 'Grill', 'No-Cook', 'Slow Cooker'
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

-- Tags table for categorization
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
