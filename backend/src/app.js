const express = require('express');
const session = require('express-session');
const cors = require('cors');
const configurePassport = require('./config/passport');
const { sessionConfig, corsConfig } = require('./config/middleware');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors(corsConfig));
  app.use(express.json());
  app.use(session(sessionConfig));

  // Passport configuration
  const passport = configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'] 
    })
  );

  app.get('/auth/google/callback', 
    passport.authenticate('google', {
      failureRedirect: '/login',
      failureMessage: true
    }), 
    (req, res) => {
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
  );

  // API routes
const categoryRoutes = require('./routes/categoryRoutes');
const ruleRoutes = require('./routes/ruleRoutes');

app.use(userRoutes);
app.use(emailRoutes);
app.use(authRoutes);
app.use(categoryRoutes);
app.use(ruleRoutes);  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
  });

  return app;
}

module.exports = createApp();
