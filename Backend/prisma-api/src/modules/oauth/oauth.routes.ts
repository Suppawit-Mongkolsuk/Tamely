import { Router, Request, Response, NextFunction } from 'express';
import passport from './oauth.config';
import { signToken, setTokenCookie } from '../../utils/jwt.utils';

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

export default router;
