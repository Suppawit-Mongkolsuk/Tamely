import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองการส่งอีเมลรีเซ็ตรหัสผ่าน
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A] flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h2 className="mb-3">ตรวจสอบอีเมลของคุณ</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่
            </p>
            <div className="bg-muted rounded-lg p-3 mb-6">
              <p className="text-sm">{email}</p>
            </div>
            <div className="bg-[#5EBCAD]/10 border border-[#5EBCAD]/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <Mail className="size-5 text-[#5EBCAD] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#003366] mb-1">ขั้นตอนถัดไป:</p>
                  <ol className="text-muted-foreground text-xs space-y-1 list-decimal list-inside">
                    <li>เปิดอีเมลของคุณ</li>
                    <li>คลิกลิงก์รีเซ็ตรหัสผ่าน (ใช้ได้ภายใน 1 ชั่วโมง)</li>
                    <li>ตั้งรหัสผ่านใหม่</li>
                    <li>เข้าสู่ระบบด้วยรหัสผ่านใหม่</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={onBack}
                className="w-full bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
                size="lg"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
              <p className="text-sm text-muted-foreground">
                ไม่ได้รับอีเมล?{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-[#003366] hover:text-[#174978] underline"
                >
                  ส่งอีกครั้ง
                </button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Info */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="size-12 rounded-xl bg-linear-to-br from-[#5EBCAD] to-[#46769B] flex items-center justify-center mb-3">
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
              เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้คุณทางอีเมล
              คุณจะสามารถตั้งรหัสผ่านใหม่และเข้าสู่ระบบได้อีกครั้ง
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">ปลอดภัยและรวดเร็ว</h4>
                <p className="text-white/70 text-sm">
                  ลิงก์รีเซ็ตรหัสผ่านจะหมดอายุภายใน 1 ชั่วโมงเพื่อความปลอดภัย
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">ข้อมูลของคุณปลอดภัย</h4>
                <p className="text-white/70 text-sm">
                  เราจะส่งลิงก์ไปยังอีเมลที่ลงทะเบียนไว้เท่านั้น
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-[#5EBCAD]/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="size-5 text-[#5EBCAD]" />
              </div>
              <div>
                <h4 className="text-white mb-1">รีเซ็ตได้ทันที</h4>
                <p className="text-white/70 text-sm">
                  ตั้งรหัสผ่านใหม่และเข้าสู่ระบบได้ภายในไม่กี่นาที
                </p>
              </div>
            </div>
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

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </button>

          <div className="mb-6">
            <h2 className="mb-2">ลืมรหัสผ่าน?</h2>
            <p className="text-muted-foreground text-sm">
              กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                ใส่อีเมลที่คุณใช้ลงทะเบียนกับ TamelyChat
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-900 mb-1">จะเกิดอะไรขึ้นต่อไป?</p>
                  <p className="text-blue-700 text-xs">
                    เราจะส่งอีเมลพร้อมลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
                    ลิงก์จะใช้ได้เพียง 1 ชั่วโมงเท่านั้น
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
              size="lg"
            >
              <Mail className="size-4 mr-2" />
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              จำรหัสผ่านได้แล้ว?{' '}
              <button
                onClick={onBack}
                className="text-[#003366] hover:text-[#174978] transition-colors underline"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-900">
                <span className="font-medium">ไม่สามารถเข้าถึงอีเมลได้?</span>
                <br />
                ติดต่อทีมสนับสนุนของเราที่{' '}
                <a href="mailto:support@tamelychat.com" className="underline">
                  support@tamelychat.com
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
