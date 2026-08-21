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

---

## AI Features

Three features call the Anthropic API: recipe import from a URL, the chat panel
on each recipe page, and the chat panel on the home page. All three run through
Netlify Functions so the API key stays on the server and never reaches the
browser.

Model used: `claude-sonnet-5`.

### Required environment variables

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys. Starts with `sk-ant-api03-`. |
| `CHAT_PASSCODE` | Shared passcode that unlocks the two chat panels. Browsing recipes does not require it. |

Copy `.env.example` to `.env` and fill both in for local development. `.env` is
gitignored — never commit it.

For the deployed site, set the same two variables in the Netlify dashboard under
**Site settings → Environment variables**, then redeploy. Variables added after a
deploy do not apply to it.

> Do **not** prefix these with `VITE_`. Anything starting with `VITE_` is inlined
> into the public JavaScript bundle and readable by any visitor.

### Running the AI features locally

`npm run dev` starts the legacy Express server, which only serves `/api/recipes`.
The AI endpoints live in Netlify Functions, so use the Netlify CLI instead:

```bash
npm install -g netlify-cli
netlify dev
```

That serves the frontend and the functions together on one port and loads `.env`
automatically.

### Cook Mode

Open any recipe with instructions and press **Start Cooking** for a full-screen,
one-step-at-a-time view (`/recipe/:id/cook`).

- Arrow buttons, keyboard arrows, or swipe move between steps; `Esc` exits.
- The screen is kept awake while cooking, where the browser supports it.
- Times written into a step ("bake for 25–30 minutes") become one-tap timers.
  Ranges start at the lower bound, since that is when you should first check.
- Timers count from a stored end time, so locking the phone does not stop them.
  They survive a page reload and fire a sound, a notification, and a vibration.

**iPhone Clock timers.** Web pages cannot create timers in the iOS Clock app —
Apple provides no URL scheme for it. Cook Mode shows a  button next to each
suggested timer that hands off to the Shortcuts app instead. To use it, create a
shortcut once:

1. Open **Shortcuts** → **+** → add the action **Start Timer**.
2. Set the duration to **Shortcut Input**.
3. Name the shortcut exactly **Cookbook Timer**.

The in-app timer works with no setup; the hand-off is only needed if you want the
timer to ring after you have closed the browser.

### Chat

The recipe page chat sees that one recipe in full and answers questions about
substitutions, scaling, and technique. The home page chat sees every recipe's
name and summary, so it can suggest what to cook and link to recipes directly.

Either one can draft a new recipe — ask it to create something and a card appears
with a **Save to cookbook** button that writes it to the database.
