const express = require('express');
const cors = require('cors');
const path = require('path');
const recipesRouter = require('./routes/recipes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/recipes', recipesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: "Aralynn's Cookbook API is running" });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
