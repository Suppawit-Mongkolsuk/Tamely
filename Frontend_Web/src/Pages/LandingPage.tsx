import { useState, useEffect } from 'react';
import {
  Plus,
  LogIn,
  Users,
  Sparkles,
  MessageSquare,
  Brain,
  Hash,
  Loader2,
  LogOut,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { WORKSPACE_COLORS } from '@/lib/constants';
import { toast } from 'sonner';

interface LandingPageProps {
  onComplete: () => void;
  onLogout?: () => void;
}

const COLORS = WORKSPACE_COLORS;

export function LandingPage({ onComplete, onLogout }: LandingPageProps) {
  const {
    workspaces,
    isLoading,
    fetchWorkspaces,
    createWorkspace,
    joinWorkspace,
    selectWorkspace,
  } = useWorkspaceContext();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelectWorkspace = async (id: string) => {
    try {
      await selectWorkspace(id);
      onComplete();
    } catch {
      toast.error('ไม่สามารถเข้า workspace ได้');
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setSubmitting(true);
    try {
      const ws = await createWorkspace({ name: createName, description: createDescription });
      await selectWorkspace(ws.id);
      setShowCreateDialog(false);
      setCreateName('');
      setCreateDescription('');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'สร้าง workspace ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    try {
      const ws = await joinWorkspace({ inviteCode });
      await selectWorkspace(ws.id);
      setShowJoinDialog(false);
      setInviteCode('');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เข้าร่วม workspace ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {onLogout && (
            <button
              onClick={onLogout}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors group"
            >
              <LogOut className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>ออกจากระบบ</span>
            </button>
          )}
          <div className="inline-flex items-center justify-center size-16 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
            <MessageSquare className="size-8 text-white" />
          </div>
          <h1 className="text-white mb-2 text-3xl">TamelyChat</h1>
          <p className="text-white/70 text-base">
            แพลตฟอร์มแชทพร้อม AI ที่ช่วยจัดการพื้นที่ทำงานของคุณ
          </p>
        </div>

        <div className="space-y-6">
          {/* Actions — สร้าง / เข้าร่วม (แสดงก่อนเสมอ) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center h-full">
                <div className="size-14 rounded-xl bg-[#5EBCAD] flex items-center justify-center mb-4">
                  <Plus className="size-7 text-white" />
                </div>
                <h3 className="mb-2 text-lg">สร้าง Workspace ใหม่</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  เริ่มต้นพื้นที่ทำงานใหม่สำหรับทีมของคุณ
                </p>
                <Button
                  className="w-full bg-[#5EBCAD] hover:bg-[#5EBCAD]/90 text-white mt-auto"
                  size="lg"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="size-5 mr-2" />
                  สร้าง Workspace
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center h-full">
                <div className="size-14 rounded-xl bg-[#75A2BF] flex items-center justify-center mb-4">
                  <LogIn className="size-7 text-white" />
                </div>
                <h3 className="mb-2 text-lg">เข้าร่วม Workspace</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  มีรหัสเชิญจากเพื่อนร่วมงาน? เข้าร่วมได้ทันที
                </p>
                <Button
                  className="w-full bg-[#75A2BF] hover:bg-[#75A2BF]/90 text-white mt-auto"
                  size="lg"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <LogIn className="size-5 mr-2" />
                  เข้าร่วม Workspace
                </Button>
              </div>
            </Card>
          </div>

          {/* Divider */}
          {workspaces.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm">Workspace ของคุณ</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
          )}

          {/* Existing Workspaces */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 text-white animate-spin" />
            </div>
          ) : workspaces.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/60 text-sm">เลือก workspace เพื่อเข้าสู่ระบบ</p>
                <div className="text-white/60 text-sm">{workspaces.length} workspace</div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {workspaces.map((ws, idx) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className="group relative bg-white/95 backdrop-blur-sm rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
                  >
                    <div className="flex justify-center mb-3">
                      <div
                        className="size-14 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      >
                        {ws.name.charAt(0)}
                      </div>
                    </div>
                    <div className="text-center mb-3">
                      <h3 className="text-base mb-1 group-hover:text-[#003366] transition-colors font-medium">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ws.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1">
                        <Users className="size-3" />
                        <span>{ws.memberCount ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="size-3" />
                        <span>{ws.roomCount ?? 0}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-[#5EBCAD] to-[#75A2BF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>สร้าง Workspace ใหม่</DialogTitle>
            <DialogDescription>ตั้งค่า workspace ใหม่สำหรับทีมของคุณ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="workspace-name">ชื่อ Workspace</Label>
              <Input
                id="workspace-name"
                placeholder="เช่น ทีมพัฒนาผลิตภัณฑ์"
                className="mt-1.5"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workspace-description">คำอธิบาย (ไม่บังคับ)</Label>
              <Input
                id="workspace-description"
                placeholder="อธิบายวัตถุประสงค์ของ workspace นี้"
                className="mt-1.5"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={handleCreate}
                disabled={submitting || !createName.trim()}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                สร้าง Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>เข้าร่วม Workspace</DialogTitle>
            <DialogDescription>ใช้รหัสเชิญเพื่อเข้าร่วม workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="invite-code">รหัสเชิญ</Label>
              <Input
                id="invite-code"
                placeholder="ใส่รหัสเชิญที่นี่"
                className="mt-1.5"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
                onClick={handleJoin}
                disabled={submitting || !inviteCode.trim()}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                เข้าร่วม Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
