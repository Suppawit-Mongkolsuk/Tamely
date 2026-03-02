import React, { useState } from 'react';
import {
  Plus,
  LogIn,
  Users,
  Sparkles,
  MessageSquare,
  Brain,
  Hash,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

interface LandingPageProps {
  onComplete: () => void;
}

export function LandingPage({ onComplete }: LandingPageProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Mock existing workspaces
  const existingWorkspaces = [
    {
      id: '1',
      name: 'Engineering Team',
      description: 'ทีมพัฒนาผลิตภัณฑ์',
      members: 24,
      unread: 12,
      rooms: 8,
      lastActivity: '2 นาทีที่แล้ว',
      color: '#5EBCAD',
    },
    {
      id: '2',
      name: 'Design Team',
      description: 'ทีมออกแบบและ UX/UI',
      members: 12,
      unread: 5,
      rooms: 5,
      lastActivity: '1 ชั่วโมงที่แล้ว',
      color: '#46769B',
    },
    {
      id: '3',
      name: 'Marketing Team',
      description: 'ทีมการตลาดและประชาสัมพันธ์',
      members: 18,
      unread: 0,
      rooms: 6,
      lastActivity: '3 ชั่วโมงที่แล้ว',
      color: '#75A2BF',
    },
  ];

  const handleCreateRoom = () => {
    // จำลองการสร้างห้อง
    setShowCreateDialog(false);
    onComplete();
  };

  const handleJoinRoom = () => {
    // จำลองการเข้าร่วมห้อง
    setShowJoinDialog(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Header - Compact */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
            <MessageSquare className="size-8 text-white" />
          </div>
          <h1 className="text-white mb-2 text-3xl">TamelyChat</h1>
          <p className="text-white/70 text-base">
            แพลตฟอร์มแชทพร้อม AI ที่ช่วยจัดการพื้นที่ทำงานของคุณ
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Existing Workspaces - Top Section */}
          {existingWorkspaces.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white mb-0.5 text-xl">
                    Workspace ของคุณ
                  </h2>
                  <p className="text-white/60 text-sm">
                    เลือก workspace เพื่อเข้าสู่ระบบ
                  </p>
                </div>
                <div className="text-white/60 text-sm">
                  {existingWorkspaces.length} workspace
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {existingWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={onComplete}
                    className="group relative bg-white/95 backdrop-blur-sm rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
                  >
                    {/* Unread Badge */}
                    {workspace.unread > 0 && (
                      <div className="absolute top-3 right-3 size-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-medium">
                        {workspace.unread}
                      </div>
                    )}

                    {/* Workspace Icon */}
                    <div className="flex justify-center mb-3">
                      <div
                        className="size-14 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: workspace.color }}
                      >
                        {workspace.name.charAt(0)}
                      </div>
                    </div>

                    {/* Workspace Info */}
                    <div className="text-center mb-3">
                      <h3 className="text-base mb-1 group-hover:text-[#003366] transition-colors font-medium">
                        {workspace.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {workspace.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1">
                        <Users className="size-3" />
                        <span>{workspace.members}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="size-3" />
                        <span>{workspace.rooms}</span>
                      </div>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-[#5EBCAD] to-[#75A2BF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {existingWorkspaces.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm">หรือ</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
          )}

          {/* Actions - Create & Join */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center h-full">
                <div className="size-14 rounded-xl bg-[#5EBCAD] flex items-center justify-center mb-4">
                  <Plus className="size-7 text-white" />
                </div>
                <h3 className="mb-2 text-lg">สร้างห้องใหม่</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  เริ่มต้นพื้นที่ทำงานใหม่สำหรับทีมของคุณ
                </p>
                <ul className="space-y-1.5 mb-6 text-sm text-left w-full">
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#5EBCAD]" />
                    <span className="text-sm">สร้าง workspace ได้ไม่จำกัด</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#5EBCAD]" />
                    <span className="text-sm">กำหนดสิทธิ์และบทบาท</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#5EBCAD]" />
                    <span className="text-sm">AI insights อัตโนมัติ</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-[#5EBCAD] hover:bg-[#5EBCAD]/90 text-white mt-auto"
                  size="lg"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="size-5 mr-2" />
                  สร้างห้องใหม่
                </Button>
              </div>
            </Card>

            {/* Join Room Card */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center h-full">
                <div className="size-14 rounded-xl bg-[#75A2BF] flex items-center justify-center mb-4">
                  <LogIn className="size-7 text-white" />
                </div>
                <h3 className="mb-2 text-lg">เข้าร่วมห้อง</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  มีรหัสเชิญจากเพื่อนร่วมงาน? เข้าร่วมได้ทันที
                </p>
                <ul className="space-y-1.5 mb-6 text-sm text-left w-full">
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#75A2BF]" />
                    <span className="text-sm">เข้าร่วมด้วยรหัสเชิญ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#75A2BF]" />
                    <span className="text-sm">เข้าถึงการสนทนาทั้งหมด</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-[#75A2BF]" />
                    <span className="text-sm">ทำงานร่วมกับทีมทันที</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-[#75A2BF] hover:bg-[#75A2BF]/90 text-white mt-auto"
                  size="lg"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <LogIn className="size-5 mr-2" />
                  เข้าร่วมห้อง
                </Button>
              </div>
            </Card>
          </div>

          {/* Features - Bottom Section */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center text-white p-4 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-white/10 backdrop-blur-sm mb-3">
                <Users className="size-5" />
              </div>
              <h4 className="text-white text-sm mb-1">ทำงานร่วมกัน</h4>
              <p className="text-white/70 text-xs">แชทแบบเรียลไทม์</p>
            </div>
            <div className="text-center text-white p-4 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-white/10 backdrop-blur-sm mb-3">
                <Brain className="size-5" />
              </div>
              <h4 className="text-white text-sm mb-1">AI-Powered</h4>
              <p className="text-white/70 text-xs">สรุปและวิเคราะห์</p>
            </div>
            <div className="text-center text-white p-4 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-white/10 backdrop-blur-sm mb-3">
                <Sparkles className="size-5" />
              </div>
              <h4 className="text-white text-sm mb-1">จัดการง่าย</h4>
              <p className="text-white/70 text-xs">ครบทุกฟีเจอร์</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>สร้าง Workspace ใหม่</DialogTitle>
            <DialogDescription>
              ตั้งค่า workspace ใหม่สำหรับทีมของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="workspace-name">ชื่อ Workspace</Label>
              <Input
                id="workspace-name"
                placeholder="เช่น ทีมพัฒนาผลิตภัณฑ์"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                ชื่อที่จะใช้แสดงสำหรับพื้นที่ทำงานของคุณ
              </p>
            </div>

            <div>
              <Label htmlFor="workspace-description">
                คำอธิบาย (ไม่บังคับ)
              </Label>
              <Input
                id="workspace-description"
                placeholder="อธิบายวัตถุประสงค์ของ workspace นี้"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="first-room">ชื่อห้องแรก</Label>
              <Input
                id="first-room"
                placeholder="เช่น General"
                defaultValue="General"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                ห้องแชทแรกที่จะสร้างใน workspace นี้
              </p>
            </div>

            <div className="bg-[#5EBCAD]/10 border border-[#5EBCAD]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="size-5 text-[#5EBCAD] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#003366] mb-1">
                    คุณจะได้รับสิทธิ์ Admin อัตโนมัติ
                  </p>
                  <p className="text-muted-foreground text-xs">
                    คุณสามารถเชิญสมาชิก สร้างห้องเพิ่มเติม
                    และจัดการสิทธิ์ได้ภายหลัง
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={handleCreateRoom}
              >
                สร้าง Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>เข้าร่วม Workspace</DialogTitle>
            <DialogDescription>
              ใช้รหัสเชิญหรือลิงค์เพื่อเข้าร่วม workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="invite-code">รหัสเชิญหรือลิงค์</Label>
              <Input
                id="invite-code"
                placeholder="ใส่รหัสเชิญหรือวางลิงค์ที่นี่"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                รหัสเชิญจะมีรูปแบบเช่น: ABCD-1234-EFGH
              </p>
            </div>

            <div className="bg-[#75A2BF]/10 border border-[#75A2BF]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Users className="size-5 text-[#75A2BF] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#003366] mb-1">ไม่มีรหัสเชิญ?</p>
                  <p className="text-muted-foreground text-xs">
                    ติดต่อผู้ดูแลระบบหรือเจ้าของ workspace เพื่อขอรหัสเชิญ
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-[#003366]" />
                ตัวอย่าง Workspace ที่พร้อมเข้าร่วม
              </h4>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                  <p className="text-sm mb-1">Engineering Team</p>
                  <p className="text-xs text-muted-foreground">
                    24 สมาชิก • รหัส: DEMO-ENG-2024
                  </p>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                  <p className="text-sm mb-1">Design Team</p>
                  <p className="text-xs text-muted-foreground">
                    12 สมาชิก • รหัส: DEMO-DES-2024
                  </p>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowJoinDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
                onClick={handleJoinRoom}
              >
                เข้าร่วม Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
