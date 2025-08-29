// Load environment variables
require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');

console.log('Environment variables check:');
['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RAPIDAPI_KEY', 'BACKEND_URL', 'FRONTEND_URL']
  .forEach(key => console.log(`${key}:`, process.env[key] ? 'Set' : 'Not set'));
console.log('PORT:', process.env.PORT);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      id: profile.id,
      login: profile.username,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || null,
      avatar_url: profile.photos?.[0]?.value || null,
      html_url: profile.profileUrl,
      bio: profile._json.bio,
      location: profile._json.location,
      public_repos: profile._json.public_repos,
      followers: profile._json.followers,
      following: profile._json.following,
      created_at: profile._json.created_at,
      provider: 'github',
      accessToken
    };
    return done(null, user);
  } catch (error) {
    console.error('GitHub Strategy Error:', error);
    return done(error, null);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      id: profile.id,
      login: profile.emails[0].value.split('@')[0],
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar_url: profile.photos[0].value,
      verified_email: profile.emails[0].verified,
      provider: 'google',
      accessToken
    };
    return done(null, user);
  } catch (error) {
    console.error('Google Strategy Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Basic Routes
app.get('/', (req, res) => res.json({ message: 'OAuth Server Running' }));

// Auth Routes (GitHub + Google)
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email', 'read:user'] }));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/auth/failure' }), (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  res.redirect(`${frontendUrl}/?auth=success&user=${encodeURIComponent(JSON.stringify(req.user))}`);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  res.redirect(`${frontendUrl}/?auth=success&user=${encodeURIComponent(JSON.stringify(req.user))}`);
});

app.get('/auth/failure', (req, res) => res.redirect(`${process.env.FRONTEND_URL}/?auth=error`));

// Import and use your existing search router
const searchRouter = require('./api/search');
app.use('/api', searchRouter);

// Fix for frontend calling wrong routes - add these exact routes
app.get('/search', async (req, res) => {
  // Redirect to proper API endpoint
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect(`/api/search?${queryString}`);
});

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Additional API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working', 
    timestamp: new Date(),
    rapidApiKey: process.env.RAPIDAPI_KEY ? 'Set' : 'Not set',
    backendUrl: process.env.BACKEND_URL,
    frontendUrl: process.env.FRONTEND_URL
  });
});

// User info route (also available at /api/user)
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;