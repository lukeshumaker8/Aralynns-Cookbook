const express = require('express');
const { getDatabase, prepare } = require('../db/database');

const router = express.Router();

// Get filter options - this route must come before /:id
router.get('/filters/options', async (req, res) => {
    try {
        await getDatabase();

        const mealTypes = prepare('SELECT DISTINCT meal_type FROM recipes WHERE meal_type IS NOT NULL').all();
        const difficulties = prepare('SELECT DISTINCT difficulty FROM recipes WHERE difficulty IS NOT NULL').all();
        const cookingMethods = prepare('SELECT DISTINCT cooking_method FROM recipes WHERE cooking_method IS NOT NULL').all();
        const tags = prepare('SELECT name FROM tags ORDER BY name').all();

        res.json({
            meal_types: mealTypes.map(m => m.meal_type),
            difficulties: difficulties.map(d => d.difficulty),
            cooking_methods: cookingMethods.map(c => c.cooking_method),
            tags: tags.map(t => t.name)
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Failed to fetch filter options' });
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
