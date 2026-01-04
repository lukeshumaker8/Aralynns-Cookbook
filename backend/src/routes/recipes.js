const express = require('express');
const { getDatabase, prepare, saveDatabase } = require('../db/database');

const router = express.Router();

// Predefined options
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'To-Go'];
const COOKING_METHODS = ['Oven', 'Stovetop', 'Slow Cooker'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Get filter options - this route must come before /:id
router.get('/filters/options', async (req, res) => {
    try {
        await getDatabase();
        const tags = prepare('SELECT name FROM tags ORDER BY name').all();

        res.json({
            meal_types: MEAL_TYPES,
            difficulties: DIFFICULTIES,
            cooking_methods: COOKING_METHODS,
            tags: tags.map(t => t.name)
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Failed to fetch filter options' });
    }
});

// Create a new recipe
router.post('/', async (req, res) => {
    try {
        await getDatabase();

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
            instructions
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Recipe name is required' });
        }

        // Insert recipe
        const result = prepare(`
            INSERT INTO recipes (name, description, image_url, prep_time, cook_time, servings, difficulty, meal_type, cooking_method, recipe_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name,
            description || null,
            image_url || null,
            prep_time || null,
            cook_time || null,
            servings || null,
            difficulty || null,
            meal_type || null,
            cooking_method || null,
            recipe_url || null
        );

        const recipeId = result.lastInsertRowid;

        // Insert ingredients if provided
        if (ingredients && ingredients.length > 0) {
            for (const ingredient of ingredients) {
                prepare('INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)').run(
                    recipeId,
                    ingredient.name,
                    ingredient.amount || '',
                    ingredient.unit || ''
                );
            }
        }

        // Insert instructions if provided
        if (instructions && instructions.length > 0) {
            instructions.forEach((instruction, index) => {
                prepare('INSERT INTO instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)').run(
                    recipeId,
                    index + 1,
                    instruction
                );
            });
        }

        // Save database to file
        saveDatabase();

        res.status(201).json({ id: recipeId, message: 'Recipe created successfully' });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});

// Get all recipes (with optional filters)
router.get('/', async (req, res) => {
    try {
        await getDatabase();

        const { meal_type, difficulty, cooking_method, search } = req.query;

        let query = `
            SELECT r.*, GROUP_CONCAT(DISTINCT t.name) as tags
            FROM recipes r
            LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
            LEFT JOIN tags t ON rt.tag_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (meal_type) {
            query += ' AND r.meal_type = ?';
            params.push(meal_type);
        }

        if (difficulty) {
            query += ' AND r.difficulty = ?';
            params.push(difficulty);
        }

        if (cooking_method) {
            query += ' AND r.cooking_method = ?';
            params.push(cooking_method);
        }

        if (search) {
            query += ' AND (r.name LIKE ? OR r.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY r.id ORDER BY r.created_at DESC';

        const recipes = prepare(query).all(...params);

        // Parse tags into array
        const result = recipes.map(recipe => ({
            ...recipe,
            tags: recipe.tags ? recipe.tags.split(',') : [],
            total_time: recipe.prep_time + recipe.cook_time
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Get single recipe with full details
router.get('/:id', async (req, res) => {
    try {
        await getDatabase();

        const { id } = req.params;

        // Get recipe
        const recipe = prepare(`
            SELECT r.*, GROUP_CONCAT(DISTINCT t.name) as tags
            FROM recipes r
            LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
            LEFT JOIN tags t ON rt.tag_id = t.id
            WHERE r.id = ?
            GROUP BY r.id
        `).get(id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        // Get ingredients
        const ingredients = prepare(`
            SELECT name, amount, unit
            FROM ingredients
            WHERE recipe_id = ?
        `).all(id);

        // Get instructions
        const instructions = prepare(`
            SELECT step_number, instruction
            FROM instructions
            WHERE recipe_id = ?
            ORDER BY step_number
        `).all(id);

        res.json({
            ...recipe,
            tags: recipe.tags ? recipe.tags.split(',') : [],
            total_time: recipe.prep_time + recipe.cook_time,
            ingredients,
            instructions
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

module.exports = router;
