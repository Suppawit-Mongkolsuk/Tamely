import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api';
import { GRADIENT } from '@/lib/constants';

interface ResetPasswordPageProps {
  /** JWT reset token จาก query string หรือส่งผ่าน prop (dev mode) */
  token: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPasswordPage({ token, onBack, onSuccess }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Password strength (สีแสดงความยาก)
  const strength = (() => {
    if (newPassword.length === 0) return null;
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    const score = [newPassword.length >= 8, hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
    if (score <= 2) return { label: 'อ่อน', color: 'bg-red-400', width: 'w-1/3' };
    if (score <= 3) return { label: 'ปานกลาง', color: 'bg-yellow-400', width: 'w-2/3' };
    return { label: 'แข็งแกร่ง', color: 'bg-green-500', width: 'w-full' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) { setError('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 8) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }

    setIsLoading(true);
    try {
      await apiClient.post<{ success: boolean; data: { message: string } }>(
        '/auth/reset-password',
        { token, newPassword },
      );
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${GRADIENT.darkBlue} flex items-center justify-center p-6`}>
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-[#003366] mb-4">
            <Lock className="size-7 text-white" />
          </div>
          <h2>{done ? 'รีเซ็ตสำเร็จแล้ว!' : 'ตั้งรหัสผ่านใหม่'}</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {done
              ? 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว'
              : 'กรอกรหัสผ่านใหม่ที่คุณต้องการใช้'}
          </p>
        </div>

        {done ? (
          /* ── Success State ── */
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle2 className="size-10 text-green-500" />
              <p className="text-sm text-center text-green-700">
                คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
              </p>
            </div>
            <Button
              onClick={onSuccess}
              className="w-full bg-[#003366] hover:bg-[#174978] text-white h-11"
            >
              ไปหน้าเข้าสู่ระบบ
            </Button>
          </div>
        ) : (
          /* ── Form State ── */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                  className="pl-10 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs ${strength.color.replace('bg-', 'text-').replace('-400', '-600').replace('-500', '-600')}`}>
                    ความแข็งแกร่ง: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> รหัสผ่านตรงกัน
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#003366] hover:bg-[#174978] text-white h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'ตั้งรหัสผ่านใหม่'
              )}
            </Button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#003366] transition-colors mt-2"
            >
              <ArrowLeft className="size-4" />
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
