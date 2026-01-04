# Aralynn's Cookbook

A recipe website with responsive cards and detailed recipe pages, built with React and SQLite.

## Features

- Browse recipes with beautiful, responsive cards
- Filter by meal type, difficulty, and cooking method
- Search recipes by name or description
- View detailed recipe pages with ingredients and step-by-step instructions
- SQLite database for storing recipes

## Tech Stack

- **Frontend**: React, React Router, Vite
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Initialize the database with sample recipes:
```bash
cd backend && npm run init-db
```

3. Start the development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── db/           # Database schema and initialization
│   │   ├── routes/       # API routes
│   │   └── index.js      # Express server
│   └── data/             # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   └── styles/       # CSS styles
│   └── index.html
└── package.json          # Root package with scripts
```

## API Endpoints

- `GET /api/recipes` - Get all recipes (with optional filters)
- `GET /api/recipes/:id` - Get a single recipe with full details
- `GET /api/recipes/filters/options` - Get available filter options
