const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function configurePassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback', // Changed back to original URL
    proxy: false // Only set to true if behind a proxy
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('Google auth callback received for user:', profile.emails[0].value);
    try {
      let user = await prisma.user.findUnique({ 
        where: { email: profile.emails[0].value } 
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
            accessToken: accessToken,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { email: profile.emails[0].value },
          data: { accessToken: accessToken },
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

module.exports = configurePassport;
