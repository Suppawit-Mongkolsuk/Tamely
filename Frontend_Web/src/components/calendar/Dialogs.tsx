// ===== Calendar Dialogs =====
import { Plus, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ---------- New Task Form State ---------- */
export interface NewTaskForm {
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
}

export const emptyNewTask: NewTaskForm = {
  title: '',
  description: '',
  date: '',
  priority: 'medium',
  assignee: 'John Doe',
};

/* ---------- Create Task Dialog ---------- */
interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTask: NewTaskForm;
  onNewTaskChange: (task: NewTaskForm) => void;
  onCreate: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  newTask,
  onNewTaskChange,
  onCreate,
}: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>สร้าง Task ใหม่</DialogTitle>
          <DialogDescription>เพิ่มงานใหม่เข้าในปฏิทิน</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="task-title">ชื่อ Task *</Label>
            <Input
              id="task-title"
              placeholder="เช่น ทำ presentation สำหรับ client"
              value={newTask.title}
              onChange={(e) =>
                onNewTaskChange({ ...newTask, title: e.target.value })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="task-description">รายละเอียด</Label>
            <Textarea
              id="task-description"
              placeholder="อธิบายรายละเอียดของงาน..."
              value={newTask.description}
              onChange={(e) =>
                onNewTaskChange({ ...newTask, description: e.target.value })
              }
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-date">วันที่ *</Label>
              <Input
                id="task-date"
                type="date"
                value={newTask.date}
                onChange={(e) =>
                  onNewTaskChange({ ...newTask, date: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="task-priority">ความสำคัญ</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') =>
                  onNewTaskChange({ ...newTask, priority: value })
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">สูง (High)</SelectItem>
                  <SelectItem value="medium">ปานกลาง (Medium)</SelectItem>
                  <SelectItem value="low">ต่ำ (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="task-assignee">มอบหมายให้</Label>
            <Select
              value={newTask.assignee}
              onValueChange={(value) =>
                onNewTaskChange({ ...newTask, assignee: value })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="John Doe">John Doe</SelectItem>
                <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                <SelectItem value="Team">ทั้งทีม</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={onCreate}
            >
              สร้าง Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- AI Create Dialog ---------- */
interface AICreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AICreateDialog({
  open,
  onOpenChange,
  onConfirm,
}: AICreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-600" />
            AI สร้าง Tasks อัตโนมัติ
          </DialogTitle>
          <DialogDescription>
            ให้ AI วิเคราะห์การสนทนาและสร้าง tasks ที่เหมาะสมให้คุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="flex items-center gap-2 mb-3">
              <AlertCircle className="size-4 text-purple-600" />
              <span className="text-sm">AI จะวิเคราะห์:</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-600" />
                การสนทนาในห้องแชททั้งหมด
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-600" />
                งานที่ยังค้างอยู่และต้องติดตาม
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-600" />
                ข้อความที่ต้องดำเนินการ (action items)
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-600" />
                Deadlines และกำหนดการที่กล่าวถึง
              </li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h4 className="mb-3 text-sm">ตัวอย่าง Tasks ที่ AI อาจสร้าง:</h4>
            <div className="space-y-2">
              <div className="text-sm p-2 rounded bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-3 text-purple-600" />
                  <span className="font-medium">Review pull requests</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ตรวจสอบ code ที่รอการ review
                </p>
              </div>
              <div className="text-sm p-2 rounded bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-3 text-purple-600" />
                  <span className="font-medium">Follow up client feedback</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ติดตามคำถามจากลูกค้าที่ยังไม่ได้ตอบ
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
              onClick={onConfirm}
            >
              <Sparkles className="size-4 mr-2" />
              ให้ AI สร้าง Tasks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
