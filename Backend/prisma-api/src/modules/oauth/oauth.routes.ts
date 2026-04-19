import { Router, Request, Response, NextFunction } from 'express';
import passport from './oauth.config';
import { signToken, setTokenCookie } from '../../utils/jwt.utils';
import { findOrCreateOAuthUser } from './oauth.service';

const router = Router();

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')[0]
  .trim();

// Google OAuth // เริ่มต้น flow OAuth โดยส่ง user ไปที่ Google login page
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const isMobile = req.query.mobile === '1'; // ถ้ามี query ?mobile=1 แสดงว่าเรียกจาก mobile app
  passport.authenticate('google', { // เริ่มต้น flow OAuth โดยส่ง user ไปที่ Google login p
    session: false,
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: isMobile ? 'mobile' : 'web',
  } as any)(req, res, next); 
});

router.get( // Google OAuth callback — Google จะ redirect user กลับมาที่ endpoint นี้พร้อมข้อมูล user
  '/google/callback',
  passport.authenticate('google', {  // Google จะ redirect user กลับมาที่ endpoint นี้พร้อมข้อมูล user
    session: false, 
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`, // ถ้า auth ไม่สำเร็จให้กลับไปหน้า login พร้อม error message
  }),
  (req: Request, res: Response) => { // สำเร็จแล้วสร้าง JWT และ redirect กลับไปหน้า workspace หรือ mobile app
    const user = req.user as { id: string }; // ดึง user จาก request
    if (!user) return res.redirect(`${CLIENT_URL}/login?error=no_user`); // เช็ค error กรณีไม่มี user ใน request

    const token = signToken(user.id, true); // สร้าง JWT token สำหรับ user นี้
    const state = req.query.state as string // ดึง state ที่เราส่งตอนเริ่มต้น flow เพื่อเช็คว่าเรียกจาก mobile หรือ web

    if (state === 'mobile') {
      // Redirect กลับไปแอป mobile พร้อม token
      return res.redirect(`tamely://auth?token=${encodeURIComponent(token)}`);
    }

    setTokenCookie(res, token, true); // ถ้าเป็น web ให้เซ็ต cookie แล้ว redirect กลับไปหน้า workspace
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

    if (!googleRes.ok) { // ถ้า token ไม่ถูกต้องหรือหมดอายุ
      res.status(401).json({ success: false, error: 'Invalid Google access token' });
      return;
    }

    const googleUser = await googleRes.json() as { // ข้อมูล user ที่ได้จาก Google
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    const user = await findOrCreateOAuthUser({ // หา user ใน database หรือสร้างใหม่ถ้ายังไม่มี
      provider: 'google', 
      providerId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture ?? null,
    });

    const token = signToken(user.id, true); // สร้าง JWT token สำหรับ user นี้
    res.json({ success: true, data: { token, user } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google mobile auth failed';
    res.status(500).json({ success: false, error: message });
  }
});
export default router;

