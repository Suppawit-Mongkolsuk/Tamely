import { Resend } from 'resend';

// ===================================================
// Email Service (Resend)
// ===================================================
// สมัคร API key ได้ที่ https://resend.com (free: 3,000 emails/เดือน)
// แล้วใส่ใน .env:
//   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
//   EMAIL_FROM=noreply@yourdomain.com
// ===================================================

//   Lazy init — ไม่สร้าง instance ตอน module โหลด
//    ป้องกัน crash เมื่อ RESEND_API_KEY ยังว่างอยู่
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        '[email.service] RESEND_API_KEY is not set in .env — ' +
        'สมัครได้ที่ https://resend.com แล้วใส่ key ใน .env',
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'TamelyChat <noreply@tamelychat.com>';
const APP_URL = process.env.CLIENT_URL?.split(',')[0].trim() || 'http://localhost:5173';
const APP_NAME = 'TamelyChat';

/**
 * ส่งอีเมล Reset Password
 * @param to      - อีเมลผู้รับ
 * @param token   - JWT reset token (อายุ 15 นาที)
 */
export const sendPasswordResetEmail = async (
  to: string,
  token: string,
): Promise<void> => {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `[${APP_NAME}] รีเซ็ตรหัสผ่านของคุณ`,
    html: buildResetEmailHtml(resetUrl),
  });

  if (error) {
    console.error('[email.service] Resend error:', error);
    throw new Error('Failed to send reset email. Please try again later.');
  }
};

// ===================================================
// HTML Template
// ===================================================
function buildResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>รีเซ็ตรหัสผ่าน</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#003366,#2F5F8A);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">${APP_NAME}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">AI-Powered Workspace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h2 style="margin:0 0 12px;color:#003366;font-size:20px;">รีเซ็ตรหัสผ่าน</h2>
              <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">
                เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ
                กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#5EBCAD,#46769B);
                          color:#ffffff;text-decoration:none;padding:14px 36px;
                          border-radius:10px;font-size:16px;font-weight:600;
                          letter-spacing:0.3px;">
                  ตั้งรหัสผ่านใหม่
                </a>
              </div>

              <!-- Warning -->
              <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:6px;margin-bottom:20px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⏱ ลิงก์นี้จะหมดอายุใน <strong>15 นาที</strong>
                </p>
              </div>

              <p style="margin:0 0 8px;color:#888;font-size:13px;">
                หากปุ่มด้านบนไม่ทำงาน คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
              </p>
              <p style="margin:0;word-break:break-all;font-size:12px;">
                <a href="${resetUrl}" style="color:#2F5F8A;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;" /></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 36px;">
              <p style="margin:0 0 6px;color:#aaa;font-size:12px;">
                หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้ รหัสผ่านของคุณจะไม่เปลี่ยนแปลง
              </p>
              <p style="margin:0;color:#ccc;font-size:11px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
