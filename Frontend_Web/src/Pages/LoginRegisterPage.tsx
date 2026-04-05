import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts';

interface LoginRegisterPageProps {
  onComplete: () => void;
  onForgotPassword: () => void;
}

export function LoginRegisterPage({
  onComplete,
  onForgotPassword,
}: LoginRegisterPageProps) {
  const { login, register, isLoading, error } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // ตรวจสอบ email format (ต้องมี @ และ TLD อย่างน้อย 2 ตัวอักษร เช่น .com .th)
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // === Frontend Validation ===
    if (!formData.email) {
      setFormError('กรุณากรอกอีเมล');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setFormError('รูปแบบอีเมลไม่ถูกต้อง (เช่น example@gmail.com)');
      return;
    }
    if (!formData.password) {
      setFormError('กรุณากรอกรหัสผ่าน');
      return;
    }
    if (formData.password.length < 8) {
      setFormError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    try {
      if (isLogin) {
        // === Login ===
        await login({
          email: formData.email,
          password: formData.password,
          rememberMe,
        });
      } else {
        // === Register ===
        if (!formData.displayName || formData.displayName.trim().length < 2) {
          setFormError('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setFormError('รหัสผ่านไม่ตรงกัน');
          return;
        }

        await register({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName.trim(),
        });
      }

      // สำเร็จ → ไปหน้าถัดไป
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="size-12 rounded-xl bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center mb-3">
                <MessageSquare className="size-7 text-white" />
              </div>
              <h1 className="text-white">TamelyChat</h1>
            </div>
            <h2 className="text-4xl leading-tight">
              ยกระดับการทำงาน
              <br />
              ของทีมด้วย AI
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              แพลตฟอร์มแชทร่วมงานที่มี AI Assistant ช่วยสรุปการสนทนา แยก tasks
              และจัดการ workspace อย่างชาญฉลาด
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">AI-Powered Insights</h4>
                <p className="text-white/70 text-sm">
                  ให้ AI ช่วยสรุปการสนทนาและแยก tasks ที่สำคัญอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">Workspace Management</h4>
                <p className="text-white/70 text-sm">
                  จัดการห้องแชท สิทธิ์การเข้าถึง และสมาชิกได้อย่างง่ายดาย
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">Real-time Collaboration</h4>
                <p className="text-white/70 text-sm">
                  แชทและแบ่งปันข้อมูลกับทีมแบบเรียลไทม์ ไม่มีล่าช้า
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <div className="text-3xl mb-1">10K+</div>
              <div className="text-white/70 text-sm">Active Users</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div>
              <div className="text-3xl mb-1">500+</div>
              <div className="text-white/70 text-sm">Organizations</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div>
              <div className="text-3xl mb-1">99.9%</div>
              <div className="text-white/70 text-sm">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#003366] flex items-center justify-center">
                <MessageSquare className="size-5 text-white" />
              </div>
              <h3>TamelyChat</h3>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-md transition-all ${
                isLogin
                  ? 'bg-white shadow-sm text-[#003366]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-md transition-all ${
                !isLogin
                  ? 'bg-white shadow-sm text-[#003366]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="กรอกชื่อ-นามสกุล"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-muted-foreground">จดจำฉันไว้</span>
                </label>
                <button
                  type="button"
                  className="text-[#003366] hover:text-[#174978] transition-colors"
                  onClick={onForgotPassword}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
            )}

            {!isLogin && (
              <div className="bg-[#5EBCAD]/10 border border-[#5EBCAD]/20 rounded-lg p-3">
                <p className="text-xs text-[#003366]">
                  การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
                  <button
                    type="button"
                    className="underline hover:text-[#174978]"
                  >
                    เงื่อนไขการใช้งาน
                  </button>{' '}
                  และ{' '}
                  <button
                    type="button"
                    className="underline hover:text-[#174978]"
                  >
                    นโยบายความเป็นส่วนตัว
                  </button>
                </p>
              </div>
            )}

            {/* Error Message */}
            {(formError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{formError || error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : isLogin ? (
                'เข้าสู่ระบบ'
              ) : (
                'สมัครสมาชิก'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-muted-foreground">
                หรือดำเนินการด้วย
              </span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/oauth/google`;
            }}
          >
            <svg className="size-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </Card>
      </div>
    </div>
  );
}
