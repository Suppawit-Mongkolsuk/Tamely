import { Router, Request, Response, NextFunction } from 'express';
import passport from './oauth.config';
import { signToken, setTokenCookie } from '../../utils/jwt.utils';
import { findOrCreateOAuthUser } from './oauth.service';

const router = Router();

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')[0]
  .trim();

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string };
    if (!user) {
      return res.redirect(`${CLIENT_URL}/login?error=no_user`);
    }

    // สร้าง JWT + set cookie เหมือน login ปกติ
    const token = signToken(user.id, true); // OAuth = remember 30d
    setTokenCookie(res, token, true);

    // Redirect กลับไป frontend
    res.redirect(`${CLIENT_URL}/workspace`);
  },
);

// GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', {
    session: false,
    scope: ['user:email'],
  }),
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=github_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string };
    if (!user) {
      return res.redirect(`${CLIENT_URL}/login?error=no_user`);
    }

    const token = signToken(user.id, true);
    setTokenCookie(res, token, true);

    res.redirect(`${CLIENT_URL}/workspace`);
  },
);

// Mobile Google OAuth — รับ accessToken จาก expo-auth-session แล้วคืน JWT
router.post('/google/mobile', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ success: false, error: 'accessToken is required' });
      return;
    }

    // Verify token กับ Google userinfo API
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      res.status(401).json({ success: false, error: 'Invalid Google access token' });
      return;
    }

    const googleUser = await googleRes.json() as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture ?? null,
    });

    const token = signToken(user.id, true);
    res.json({ success: true, data: { token, user } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google mobile auth failed';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
