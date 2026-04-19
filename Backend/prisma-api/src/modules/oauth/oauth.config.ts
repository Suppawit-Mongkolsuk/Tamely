import dotenv from 'dotenv';
dotenv.config(); // ต้องโหลด env ก่อน passport strategies

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { findOrCreateOAuthUser } from './oauth.service';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  done(null, { id });
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log(
    'GOOGLE_CLIENT_ID:',
    process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...',
  );
  console.log(
    'GOOGLE_CLIENT_SECRET:',
    process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...',
  );
  console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'http://localhost:8080/api/oauth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account has no email'), undefined);
          }

          const user = await findOrCreateOAuthUser({
            provider: 'google',
            providerId: profile.id,
            email,
            name: profile.displayName || email.split('@')[0],
            avatarUrl: profile.photos?.[0]?.value || null,
          });

          // ส่ง user object ที่มี id field (ไม่จำเป็นต้องเป็น full user)
          done(null, { id: user.id });
        } catch (error) {
          console.error(' Google OAuth error:', error);
          done(error as Error, undefined);
        }
      },
    ),
  );
  console.log('Google OAuth strategy configured');
} else {
  console.log(
    'Google OAuth not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)',
  );
}
export default passport;
