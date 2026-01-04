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

   **Windows (using Scoop):**
   ```powershell
   # Install Scoop first if you don't have it
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

   # Then install Turso
   scoop install turso
   ```

   **Windows (Manual Download):**
   - Go to [github.com/tursodatabase/turso-cli/releases](https://github.com/tursodatabase/turso-cli/releases)
   - Download the latest `turso_windows_amd64.zip`
   - Extract and add to your PATH

   **macOS/Linux:**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
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

   **Save these values - you'll need them for Netlify!**

### Step 2: Initialize the Database

1. Install the script dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Run the initialization script with your credentials:

   **Windows (PowerShell):**
   ```powershell
   $env:TURSO_DATABASE_URL="libsql://your-db-name-yourname.turso.io"
   $env:TURSO_AUTH_TOKEN="your-token-here"
   node init-turso.js
   ```

   **macOS/Linux:**
   ```bash
   TURSO_DATABASE_URL="libsql://your-db-name-yourname.turso.io" TURSO_AUTH_TOKEN="your-token-here" node init-turso.js
   ```

### Step 3: Deploy to Netlify

1. Push this repo to GitHub

2. Go to [netlify.com](https://netlify.com) and click **"Add new site"** → **"Import an existing project"**

3. Connect your GitHub repo

4. Netlify should auto-detect settings. If not, use:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`

5. **Add Environment Variables** (Site Settings → Environment Variables):
   - `TURSO_DATABASE_URL` = your database URL from Step 1
   - `TURSO_AUTH_TOKEN` = your auth token from Step 1

6. Click **Deploy!**

### Step 4: Connect a Custom Domain

1. In Netlify, go to **Site Settings** → **Domain management**

2. Click **"Add a domain"**

3. Enter your domain name (e.g., `aralynns-cookbook.com`)

4. **Option A - Use Netlify DNS (Recommended):**
   - Click "Set up Netlify DNS"
   - Netlify will give you nameservers (like `dns1.p01.nsone.net`)
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Update nameservers to the ones Netlify provided
   - Wait 24-48 hours for propagation

5. **Option B - Keep your current DNS:**
   - Add these DNS records at your registrar:
   - **A Record:** `@` → `75.2.60.5`
   - **CNAME Record:** `www` → `your-site-name.netlify.app`

6. **Enable HTTPS:**
   - Go to **Domain management** → **HTTPS**
   - Click **"Verify DNS configuration"**
   - Click **"Provision certificate"**
   - Netlify will automatically set up free SSL

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

---

## Troubleshooting

**"Cannot GET /" error locally:**
- Make sure you're accessing `http://localhost:5173` (frontend), not `http://localhost:3001` (API)

**Database not initialized:**
- Run `cd backend && npm run init-db` for local dev
- Run the `scripts/init-turso.js` script for production

**Netlify build fails:**
- Check that environment variables are set correctly
- Make sure base directory is set to `frontend`
