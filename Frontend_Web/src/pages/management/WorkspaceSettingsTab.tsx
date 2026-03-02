// ===== Workspace Settings Tab =====
import { Plus, Edit, Upload, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { Role } from './types';

interface WorkspaceSettingsTabProps {
  roles: Role[];
  onCreateRole: () => void;
}

export function WorkspaceSettingsTab({
  roles,
  onCreateRole,
}: WorkspaceSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6 bg-white">
          <h3 className="mb-4">ข้อมูลทั่วไป</h3>

          <div className="space-y-4">
            {/* Workspace Icon */}
            <div>
              <Label>ไอคอน Workspace</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="size-20 rounded-xl bg-[#003366] flex items-center justify-center text-white text-2xl">
                  E
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">
                    <Upload className="size-4 mr-2" />
                    อัปโหลดรูป
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    แนะนำขนาด 256x256px, PNG หรือ JPG
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Workspace Name */}
            <div>
              <Label htmlFor="workspace-name">ชื่อ Workspace</Label>
              <Input
                id="workspace-name"
                defaultValue="Engineering Team"
                className="mt-1.5"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="workspace-desc">คำอธิบาย</Label>
              <Textarea
                id="workspace-desc"
                defaultValue="Development and technical discussions"
                className="mt-1.5"
                rows={3}
              />
            </div>

            {/* Workspace URL */}
            <div>
              <Label htmlFor="workspace-url">URL Workspace</Label>
              <div className="flex gap-2 mt-1.5">
                <span className="inline-flex items-center px-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground">
                  tamelychat.com/
                </span>
                <Input
                  id="workspace-url"
                  defaultValue="engineering"
                  className="flex-1"
                />
              </div>
            </div>

            <Button className="w-full bg-[#5EBCAD] hover:bg-[#5EBCAD]/90">
              <Save className="size-4 mr-2" />
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </Card>

        {/* Roles & Permissions */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3>ยศและสิทธิ์</h3>
            <Button size="sm" variant="outline" onClick={onCreateRole}>
              <Plus className="size-4 mr-2" />
              สร้างยศ
            </Button>
          </div>

          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-4 rounded-lg border border-border hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.permissions.length} สิทธิ์
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {perm.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card className="p-6 bg-white">
        <h3 className="mb-4">การตั้งค่าเพิ่มเติม</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">อนุญาตให้สมาชิกเชิญคนอื่น</p>
              <p className="text-sm text-muted-foreground">
                สมาชิกสามารถสร้างลิงก์เชิญและเชิญคนอื่นเข้า workspace
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">อนุญาตให้สมาชิกสร้างห้องได้</p>
              <p className="text-sm text-muted-foreground">
                สมาชิกสามารถสร้างห้องแชทใหม่ได้เอง
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">แสดงสถานะออนไลน์</p>
              <p className="text-sm text-muted-foreground">
                แสดงว่าสมาชิกกำลังออนไลน์หรือไม่
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">เปิดใช้งาน AI Assistant</p>
              <p className="text-sm text-muted-foreground">
                ให้ AI ช่วยสรุปการสนทนาและสร้าง tasks อัตโนมัติ
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}
