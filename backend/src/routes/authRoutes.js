const express = require('express');
const passport = require('passport');
const router = express.Router();

// Check auth status
router.get('/check', (req, res) => {
  const authenticated = req.isAuthenticated() && req.user;
  res.json({ 
    authenticated,
    user: authenticated ? req.user : null 
  });
});

// Logout
router.post('/logout', (req, res) => {
  console.log('Logout request received');
  if (!req.isAuthenticated()) {
    console.log('User not authenticated, sending success anyway');
    return res.json({ success: true });
  }
  
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    console.log('User logged out successfully, destroying session');
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      // Clear cookie
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// Google OAuth routes (must match Google Console and passport.js config)
router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth...');
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('Received Google callback...');
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
    failureMessage: true
  })(req, res, next);
}, (req, res) => {
  console.log('Authentication successful, saving session...');
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`);
    }
    console.log('Session saved successfully, redirecting...');
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
});

module.exports = router;
