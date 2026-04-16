// ===== Workspace Settings Tab =====
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Upload, Save, Copy, Check, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { workspaceService } from '@/services/workspace.service';
import type { Workspace } from '@/types';
import type { Role } from '@/types/management-ui';

interface WorkspaceSettingsTabProps {
  roles: Role[];
  workspace: Workspace | null;
  onCreateRole: () => void;
  onEditRole?: (role: Role) => void;
  onDeleteRole?: (role: Role) => void;
  onWorkspaceUpdated?: (updated: Workspace) => void;
  canManageWorkspace?: boolean;
  canManageRoles?: boolean;
  canRegenerateInvite?: boolean;
}

/* ---------- Invite Code Section ---------- */
function InviteCodeSection({
  workspace,
  onWorkspaceUpdated,
  canRegenerateInvite = false,
}: {
  workspace: Workspace;
  onWorkspaceUpdated?: (updated: Workspace) => void;
  canRegenerateInvite?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    toast.success('คัดลอกรหัสเชิญแล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setShowConfirm(false);
    setRegenerating(true);
    try {
      const result = await workspaceService.regenerateInviteCode(workspace.id);
      toast.success('สร้างรหัสเชิญใหม่สำเร็จ');
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated({ ...workspace, inviteCode: result.inviteCode });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label>รหัสเชิญ (Invite Code)</Label>
        <p className="text-xs text-muted-foreground">
          แชร์รหัสนี้ให้คนที่ต้องการเข้าร่วม workspace
        </p>
        <div className="flex gap-2 mt-1.5">
          <Input
            readOnly
            value={workspace.inviteCode}
            className="font-mono text-sm bg-muted"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title="คัดลอกรหัส"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowConfirm(true)}
            disabled={regenerating || !canRegenerateInvite}
            title="สร้างรหัสใหม่"
          >
            <RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Confirm Regenerate Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างรหัสเชิญใหม่?</DialogTitle>
            <DialogDescription>
              รหัสเชิญเดิมจะใช้งานไม่ได้อีกต่อไปทันที
              คนที่ยังไม่ได้เข้าร่วมจะต้องใช้รหัสใหม่แทน
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={handleRegenerate}
            >
              <RefreshCw className="size-4 mr-2" />
              สร้างรหัสใหม่
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorkspaceSettingsTab({
  roles,
  workspace,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onWorkspaceUpdated,
  canManageWorkspace = false,
  canManageRoles = false,
  canRegenerateInvite = false,
}: WorkspaceSettingsTabProps) {
  const [name, setName] = useState(workspace?.name ?? '');
  const [description, setDescription] = useState(workspace?.description ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? '');
    setDescription(workspace?.description ?? '');
  }, [workspace?.id, workspace?.name, workspace?.description]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await workspaceService.updateWorkspace(workspace.id, {
        name,
        description,
      });
      toast.success('บันทึกการเปลี่ยนแปลงสำเร็จ');
      onWorkspaceUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

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
                  {workspace?.name?.[0]?.toUpperCase() ?? 'W'}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="workspace-desc">คำอธิบาย</Label>
              <Textarea
                id="workspace-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            {/* Invite Code */}
            {workspace && (
              <>
                <Separator />
                <InviteCodeSection
                  workspace={workspace}
                  onWorkspaceUpdated={onWorkspaceUpdated}
                  canRegenerateInvite={canRegenerateInvite}
                />
              </>
            )}

            <Button
              className="w-full bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={handleSave}
              disabled={saving || !workspace || !canManageWorkspace}
            >
              <Save className="size-4 mr-2" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </Card>

        {/* Roles & Permissions */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3>ยศและสิทธิ์</h3>
            <Button size="sm" variant="outline" onClick={onCreateRole} disabled={!canManageRoles}>
              <Plus className="size-4 mr-2" />
              สร้างยศ
            </Button>
          </div>

          <div className="space-y-3">
            {roles.length > 0 ? roles.map((role) => (
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRole?.(role)}
                      disabled={!canManageRoles}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRole?.(role)}
                      disabled={!canManageRoles}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {perm.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                ยังไม่มี custom role ใน workspace นี้
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
