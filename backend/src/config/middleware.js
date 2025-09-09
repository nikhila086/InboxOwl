const session = require('express-session');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Extends session on activity
  cookie: {
    // Modern browsers require secure=true when sameSite=none
    // For local development with HTTP:
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: 'lax', // More compatible option for development
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  },
  name: 'inboxowl.sid' // Custom session name
};

const corsConfig = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

module.exports = {
  sessionConfig,
  corsConfig
};
