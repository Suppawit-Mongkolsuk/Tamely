// ===== Profile Tab — ข้อมูลโปรไฟล์ผู้ใช้ =====
import { useState, useRef } from 'react';
import { LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { userService } from '@/services';
import { toast } from 'sonner';

interface ProfileTabProps {
  onLogout: () => void;
}

export function ProfileTab({ onLogout }: ProfileTabProps) {
  const { user, setUser } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state — ดึงจาก user จริง
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ?? null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // คำนวณ initials จาก displayName
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทและขนาดไฟล์
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG หรือ GIF');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let updatedUser = user;

      // 1. อัปโหลด avatar ก่อน (ถ้ามีไฟล์ใหม่)
      if (avatarFile) {
        updatedUser = await userService.uploadAvatar(avatarFile);
        setAvatarFile(null);
      }

      // 2. อัปเดต displayName + bio
      updatedUser = await userService.updateProfile({ displayName, bio });

      // 3. อัปเดต global state
      setUser(updatedUser);
      toast.success('บันทึกโปรไฟล์เรียบร้อย');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ไม่สามารถบันทึกโปรไฟล์ได้';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToWorkspace = () => {
    clearCurrentWorkspace();
    navigate('/workspace');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white">
        <h3 className="mb-6">Profile Information</h3>
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={displayName}
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div className="size-24 rounded-full bg-[#5EBCAD] flex items-center justify-center text-white">
                <span className="text-2xl font-semibold">{initials}</span>
              </div>
            )}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <Separator />

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName">ชื่อที่แสดง</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อของคุณ"
              className="mt-1.5"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="profileEmail">อีเมล</Label>
            <Input
              id="profileEmail"
              type="email"
              value={email}
              disabled
              className="mt-1.5 bg-muted/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              อีเมลไม่สามารถเปลี่ยนแปลงได้
            </p>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="แนะนำตัวสั้นๆ"
              className="mt-1.5"
            />
          </div>

          {/* Save / Cancel */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" disabled={saving} onClick={() => {
              setDisplayName(user?.displayName ?? '');
              setBio(user?.bio ?? '');
              setAvatarPreview(user?.avatarUrl ?? null);
              setAvatarFile(null);
            }}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Buttons — ย้อนกลับ Workspace / Logout */}
      <Card className="p-6 bg-white">
        <h3 className="mb-4">Account</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleBackToWorkspace}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            กลับไปเลือก Workspace
          </Button>
          <Button
            variant="destructive"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="size-4" />
            ออกจากระบบ
          </Button>
        </div>
      </Card>
    </div>
  );
}
