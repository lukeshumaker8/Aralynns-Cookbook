# Aralynn's Cookbook

A recipe website with responsive cards and detailed recipe pages, built with React and Turso (SQLite).

## Features

- Browse recipes with beautiful, responsive cards
- Filter by meal type, difficulty, and cooking method
- Search recipes by name or description
- View detailed recipe pages with ingredients and step-by-step instructions
- Add new recipes with external recipe links
- Deployed on Netlify with Turso database

## Tech Stack

- **Frontend**: React, React Router, Vite
- **Backend**: Netlify Functions
- **Database**: Turso (distributed SQLite)

---

## Deploy to Netlify

### Step 1: Create a Turso Database

1. Go to [turso.tech](https://turso.tech) and sign up (free tier available)

2. Install the Turso CLI:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (PowerShell)
   iwr get.tur.so/install.ps1 -useb | iex
   ```

3. Login and create a database:
   ```bash
   turso auth login
   turso db create aralynns-cookbook
   ```

4. Get your database URL and token:
   ```bash
   turso db show aralynns-cookbook --url
   turso db tokens create aralynns-cookbook
   ```

   Save these values - you'll need them for Netlify!

### Step 2: Initialize the Database

1. Install the script dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Run the initialization script with your credentials:
   ```bash
   # Windows (PowerShell)
   $env:TURSO_DATABASE_URL="your-database-url"; $env:TURSO_AUTH_TOKEN="your-token"; node init-turso.js

   # macOS/Linux
   TURSO_DATABASE_URL="your-database-url" TURSO_AUTH_TOKEN="your-token" node init-turso.js
   ```

### Step 3: Deploy to Netlify

1. Push this repo to GitHub

2. Go to [netlify.com](https://netlify.com) and click "Add new site" > "Import an existing project"

3. Connect your GitHub repo

4. **Important**: Add environment variables in Netlify:
   - Go to Site Settings > Environment Variables
   - Add:
     - `TURSO_DATABASE_URL` = your database URL from Step 1
     - `TURSO_AUTH_TOKEN` = your auth token from Step 1

5. Deploy! Netlify will automatically build and deploy your site.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Initialize the local database with sample recipes:
   ```bash
   cd backend && npm run init-db
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

---

## Project Structure

```
├── netlify/
│   └── functions/        # Netlify serverless functions
│       ├── recipes.js    # API endpoints
│       └── lib/db.js     # Turso database client
├── scripts/
│   └── init-turso.js     # Database initialization script
├── backend/              # Local development server
│   └── src/
│       ├── db/           # Local SQLite setup
│       └── routes/       # Express routes
├── frontend/
│   └── src/
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       └── styles/       # CSS styles
├── netlify.toml          # Netlify configuration
└── package.json
```

## API Endpoints

- `GET /api/recipes` - Get all recipes (with optional filters)
- `GET /api/recipes/:id` - Get a single recipe with full details
- `GET /api/recipes/filters/options` - Get available filter options
- `POST /api/recipes` - Create a new recipe
