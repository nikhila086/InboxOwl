const express = require('express');
const session = require('express-session');
const cors = require('cors');
const configurePassport = require('./config/passport');
const { sessionConfig, corsConfig } = require('./config/middleware');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ruleRoutes = require('./routes/ruleRoutes');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors(corsConfig));
  
  // Additional CORS headers for preflight requests
  app.options('*', cors(corsConfig));
  
  app.use(express.json());
  app.use(session(sessionConfig));

  // Passport configuration
  const passport = configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes (including Google OAuth)
  app.use('/api/auth', authRoutes);
  
  // Google OAuth routes (direct mount for backward compatibility)
  app.use('/auth', authRoutes);

  // API routes
  app.use('/api/emails', emailRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/spam-rules', ruleRoutes);
  app.use('/api/users', userRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      headers: req.headers
    });
    res.status(500).json({ 
      error: 'Something broke!',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Handle 404s
  app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.path);
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

module.exports = createApp();
