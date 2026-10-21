const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const seedDatabase = require('./db/seed');
const { authMiddleware } = require('./middleware/auth');

const usersRouter = require('./routes/users');
const kudosRouter = require('./routes/kudos');
const moderationRouter = require('./routes/moderation');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Seed initial dataset if first run
seedDatabase();

// Global Auth Context Middleware
app.use(authMiddleware);

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/kudos', kudosRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Datacom Kudos Portal',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if present
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found', path: req.originalUrl });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Datacom Kudos Portal Server Started`);
    console.log(` API Endpoint: http://localhost:${PORT}/api`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
