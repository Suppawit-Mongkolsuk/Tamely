import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, MessageSquare, Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api';
import { GRADIENT } from '@/lib/constants';

interface ForgotPasswordPageProps {
  onBack: () => void;
  /** เรียกเมื่อต้องการไปหน้า reset-password (ส่ง token ไปด้วย) */
  onResetToken?: (token: string) => void;
}

export function ForgotPasswordPage({ onBack, onResetToken }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  /** Dev mode: backend ส่ง token กลับมาตรงๆ */
  const [devToken, setDevToken] = useState<string | null>(null);
  const [showDevToken, setShowDevToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('รูปแบบอีเมลไม่ถูกต้อง (เช่น example@gmail.com)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        success: boolean;
        data: {
          message: string;
          resetToken?: string;
          expiresInMinutes?: number;
        };
      }>('/auth/forgot-password', { email: email.trim().toLowerCase() });

      setSent(true);

      // Dev mode: backend ส่ง resetToken กลับมา → แสดงลิงก์ทดสอบ
      if (res.data?.resetToken) {
        setDevToken(res.data.resetToken);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${GRADIENT.darkBlue} flex items-center justify-center p-4 sm:p-6`}>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        {/* Left Side — Info Panel */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="size-12 rounded-xl bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center">
                <MessageSquare className="size-7 text-white" />
              </div>
              <h1 className="text-white">TamelyChat</h1>
            </div>
            <h2 className="text-4xl leading-tight">
              ลืมรหัสผ่าน?
              <br />
              ไม่ต้องกังวล
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
              ลิงก์มีอายุ 15 นาทีเพื่อความปลอดภัย
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: 'ปลอดภัยและรวดเร็ว', desc: 'ลิงก์จะหมดอายุภายใน 15 นาทีเพื่อความปลอดภัย' },
              { title: 'ข้อมูลของคุณปลอดภัย', desc: 'เราจะส่งลิงก์ไปยังอีเมลที่ลงทะเบียนไว้เท่านั้น' },
              { title: 'รีเซ็ตได้ทันที', desc: 'ตั้งรหัสผ่านใหม่และเข้าสู่ระบบได้ภายในไม่กี่นาที' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="size-5 text-[#5EBCAD]" />
                </div>
                <div>
                  <h4 className="text-white mb-1">{item.title}</h4>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 text-sm mb-3">💡 เคล็ดลับความปลอดภัย</p>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#5EBCAD]">•</span>
                <span>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5EBCAD]">•</span>
                <span>ผสมตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และสัญลักษณ์</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5EBCAD]">•</span>
                <span>หลีกเลี่ยงการใช้ข้อมูลส่วนตัวที่เดาได้ง่าย</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side — Form / Success */}
        <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#003366] flex items-center justify-center">
                <MessageSquare className="size-5 text-white" />
              </div>
              <h3>TamelyChat</h3>
            </div>
          </div>

          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </button>

          {sent ? (
            /* ── Success State ── */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center size-14 rounded-full bg-green-100 mb-2">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h2 className="mb-1">ตรวจสอบอีเมลของคุณ</h2>
                <p className="text-muted-foreground text-sm">
                  หากอีเมล <span className="font-semibold text-foreground">{email}</span>{' '}
                  มีอยู่ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านภายในไม่กี่นาที
                </p>
              </div>

              <div className="bg-[#5EBCAD]/10 border border-[#5EBCAD]/20 rounded-lg p-4">
                <div className="flex items-start gap-3 text-left">
                  <Mail className="size-5 text-[#5EBCAD] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-[#003366] mb-1">ขั้นตอนถัดไป:</p>
                    <ol className="text-muted-foreground text-xs space-y-1 list-decimal list-inside">
                      <li>เปิดอีเมลของคุณ</li>
                      <li>คลิกลิงก์รีเซ็ตรหัสผ่าน (ใช้ได้ภายใน 15 นาที)</li>
                      <li>ตั้งรหัสผ่านใหม่</li>
                      <li>เข้าสู่ระบบด้วยรหัสผ่านใหม่</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Dev-only token display — token ซ่อนด้วย type="password" */}
              {devToken && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-800">
                      🛠 Dev Mode — Reset Token (15 นาที)
                    </span>
                  </div>

                  {/* Token input — hidden by default */}
                  <div className="relative">
                    <input
                      type={showDevToken ? 'text' : 'password'}
                      value={devToken}
                      readOnly
                      className="w-full pr-20 pl-3 py-2 text-xs font-mono rounded-lg border border-amber-200 bg-white text-amber-900 focus:outline-none"
                    />
                    {/* Toggle show/hide */}
                    <button
                      type="button"
                      onClick={() => setShowDevToken((v) => !v)}
                      className="absolute right-9 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800 transition-colors"
                      title={showDevToken ? 'ซ่อน token' : 'แสดง token'}
                    >
                      {showDevToken ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(devToken);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800 transition-colors"
                      title="คัดลอก token"
                    >
                      {copied ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-amber-700">
                    ⚠️ แสดงเฉพาะ NODE_ENV=development เท่านั้น จะไม่ปรากฏใน Production
                  </p>

                  <button
                    type="button"
                    onClick={() => onResetToken?.(devToken)}
                    className="w-full py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition-colors"
                  >
                    ไปหน้า Reset Password →
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setDevToken(null);
                  setEmail('');
                }}
              >
                ส่งอีกครั้ง
              </Button>

              <Button
                onClick={onBack}
                className="w-full bg-[#003366] hover:bg-[#174978] text-white"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="mb-6">
                <h2 className="mb-2">ลืมรหัสผ่าน?</h2>
                <p className="text-muted-foreground text-sm">
                  กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">อีเมล</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      เราจะส่งอีเมลพร้อมลิงก์รีเซ็ตรหัสผ่านให้คุณ
                      ลิงก์จะใช้ได้เพียง{' '}
                      <span className="font-semibold">15 นาที</span> เท่านั้น
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#003366] hover:bg-[#174978] text-white h-11"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4 mr-2" />
                      ส่งลิงก์รีเซ็ตรหัสผ่าน
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  จำรหัสผ่านได้แล้ว?{' '}
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-[#003366] hover:text-[#174978] transition-colors underline"
                  >
                    เข้าสู่ระบบ
                  </button>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}