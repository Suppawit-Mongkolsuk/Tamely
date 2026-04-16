// ===== Calendar Dialogs =====
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

/* ---------- Types ---------- */
export interface NewTaskForm {
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  assigneeId: string; // userId ของคนที่ assign ให้
}

export interface AssignableMember {
  userId: string;
  name: string;
}

export const emptyNewTask: NewTaskForm = {
  title: '',
  description: '',
  date: '',
  priority: 'medium',
  assigneeId: '',
};

/* ---------- Create Task Dialog ---------- */
interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTask: NewTaskForm;
  onNewTaskChange: (task: NewTaskForm) => void;
  onCreate: () => void;
  canAssign: boolean;           // OWNER/ADMIN = true, MODERATOR/MEMBER = false
  members: AssignableMember[];  // รายชื่อสมาชิกสำหรับ dropdown
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  newTask,
  onNewTaskChange,
  onCreate,
  canAssign,
  members,
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

          {/* แสดง dropdown มอบหมายเฉพาะ OWNER/ADMIN เท่านั้น */}
          {canAssign && members.length > 0 && (
            <div>
              <Label htmlFor="task-assignee">มอบหมายให้</Label>
              <Select
                value={newTask.assigneeId}
                onValueChange={(value) =>
                  onNewTaskChange({ ...newTask, assigneeId: value })
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="เลือกสมาชิก" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

/* ---------- Edit Task Dialog ---------- */
export interface EditTaskForm {
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  assigneeId: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask: EditTaskForm;
  onEditTaskChange: (task: EditTaskForm) => void;
  onUpdate: () => void;
  canAssign: boolean;
  members: AssignableMember[];
}

export function EditTaskDialog({
  open,
  onOpenChange,
  editTask,
  onEditTaskChange,
  onUpdate,
  canAssign,
  members,
}: EditTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>แก้ไข Task</DialogTitle>
          <DialogDescription>แก้ไขรายละเอียดของงาน</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="edit-task-title">ชื่อ Task *</Label>
            <Input
              id="edit-task-title"
              value={editTask.title}
              onChange={(e) => onEditTaskChange({ ...editTask, title: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="edit-task-description">รายละเอียด</Label>
            <Textarea
              id="edit-task-description"
              value={editTask.description}
              onChange={(e) => onEditTaskChange({ ...editTask, description: e.target.value })}
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-task-date">วันที่ *</Label>
              <Input
                id="edit-task-date"
                type="date"
                value={editTask.date}
                onChange={(e) => onEditTaskChange({ ...editTask, date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>ความสำคัญ</Label>
              <Select
                value={editTask.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') =>
                  onEditTaskChange({ ...editTask, priority: value })
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
            <Label>สถานะ</Label>
            <Select
              value={editTask.status}
              onValueChange={(value: 'todo' | 'in-progress' | 'completed') =>
                onEditTaskChange({ ...editTask, status: value })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canAssign && members.length > 0 && (
            <div>
              <Label>มอบหมายให้</Label>
              <Select
                value={editTask.assigneeId}
                onValueChange={(value) => onEditTaskChange({ ...editTask, assigneeId: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="เลือกสมาชิก" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
              onClick={onUpdate}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
