import { createClient } from '@libsql/client/web';

let db = null;

export function getDatabase() {
  if (db) return db;

  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return db;
}

// Predefined options
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'To-Go'];
export const COOKING_METHODS = ['Oven', 'Stovetop', 'Slow Cooker'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
