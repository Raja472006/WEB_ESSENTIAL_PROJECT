const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const goalRoutes = require('./routes/goalRoutes');
const waterRoutes = require('./routes/waterRoutes');
const historyRoutes = require('./routes/historyRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'NutriTrack – Food & Nutrition Tracker',
    databaseEngine: db.getEngine(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', foodRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', goalRoutes);
app.use('/api', waterRoutes);
app.use('/api', historyRoutes);
app.use('/api', profileRoutes);

// Fallback to index.html for direct navigation if file not matched
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 API handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please try again later.'
  });
});

// Start Server
async function startServer() {
  try {
    console.log('[NutriTrack] Initializing database...');
    await db.init();

    app.listen(PORT, () => {
      console.log('==================================================');
      console.log(` NutriTrack Server is running!`);
      console.log(` Local URL:    http://localhost:${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` DB Engine:    ${db.getEngine().toUpperCase()}`);
      console.log('==================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
