const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'lax',
    secure: false,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user in DB, store accessToken
  let user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        name: profile.displayName,
        accessToken: accessToken,
      },
    });
  } else {
    // Update accessToken if user exists
    await prisma.user.update({
      where: { email: profile.emails[0].value },
      data: { accessToken: accessToken },
    });
  }
  user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
  return done(null, user);
}));
// Fetch all emails for authenticated user
app.get('/gmail', async (req, res) => {
  if (!req.user || !req.user.accessToken) return res.status(401).send('Not authenticated');
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: req.user.accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  try {
    // List messages
    const messagesRes = await gmail.users.messages.list({ userId: 'me', maxResults: 20 });
    const messages = messagesRes.data.messages || [];
    // Fetch details for each message
    const emails = [];
    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const payload = msgRes.data.payload;
      const headers = payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const snippet = msgRes.data.snippet;
      const labels = (msgRes.data.labelIds || []).join(',');
      // Save to DB if not already present
      await prisma.email.upsert({
        where: { id: msg.id },
        update: {},
        create: {
          id: msg.id,
          subject,
          sender: from,
          snippet,
          labels,
          date,
          userId: req.user.id,
        },
      });
      emails.push({ id: msg.id, subject, from, date, snippet, labels });
    }
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'] }));

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
}), (req, res) => {
  // Redirect to frontend dashboard after successful login
  res.redirect('http://localhost:5173/');
});

// Create a new user (manual)
app.post('/users', async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await prisma.user.create({
      data: { email, name },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
