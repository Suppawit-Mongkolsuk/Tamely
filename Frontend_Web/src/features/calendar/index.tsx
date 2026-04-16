import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { TaskList } from '@/components/calendar/TaskList';
import { CreateTaskDialog, EditTaskDialog, emptyNewTask } from '@/components/calendar/Dialogs';
import type { NewTaskForm, EditTaskForm, AssignableMember } from '@/components/calendar/Dialogs';
import { getTasksForDate } from '@/types/calendar-ui';
import type { Task } from '@/types/calendar-ui';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { calendarService } from '@/services/calendar.service';
import { workspaceService } from '@/services/workspace.service';
import type { TaskResponse } from '@/services/calendar.service';

function mapTask(t: TaskResponse): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    date: t.date.split('T')[0],
    priority: t.priority.toLowerCase() as Task['priority'],
    status:
      t.status === 'IN_PROGRESS'
        ? 'in-progress'
        : (t.status.toLowerCase() as Task['status']),
    assignee: t.assignee?.Name ?? 'Unassigned',
    assignedBy: t.createdByUser?.Name ?? t.assignee?.Name ?? 'Unknown',
    createdBy: t.createdBy.toLowerCase() as Task['createdBy'],
  };
}

export function CalendarPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditTaskForm>({
    title: '',
    description: '',
    date: '',
    priority: 'medium',
    status: 'todo',
    assigneeId: '',
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTaskForm>(emptyNewTask);
  const [members, setMembers] = useState<AssignableMember[]>([]);

  const selectedDateTasks = getTasksForDate(tasks, selectedDate);
  // role มาจาก currentWorkspace โดยตรง (backend ส่ง role กลับมาพร้อม workspace เสมอ)
  const myRole = currentWorkspace?.role ?? 'MEMBER';
  const canAssign = myRole === 'OWNER' || myRole === 'ADMIN';

  // โหลด members list เมื่อ workspace เปลี่ยน (ใช้สำหรับ dropdown มอบหมายงาน)
  useEffect(() => {
    if (!wsId) return;
    workspaceService.getMembers(wsId).then((list) => {
      setMembers(list.map((m) => ({ userId: m.userId, name: m.user.Name })));
    }).catch(() => {});
  }, [wsId]);

  const fetchTasks = useCallback(async () => {
    if (!wsId || !user) return;
    try {
      const data = await calendarService.getTasks(wsId, {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      setTasks(data.map(mapTask));
    } catch {
      toast.error('โหลด task ไม่สำเร็จ');
    }
  }, [wsId, currentDate, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleCreateTask = async () => {
    if (!wsId || !newTask.title || !newTask.date) {
      toast.error('กรุณากรอกชื่อ task และเลือกวันที่');
      return;
    }

    try {
      await calendarService.createTask(wsId, {
        title: newTask.title,
        description: newTask.description,
        date: newTask.date,
        priority: newTask.priority.toUpperCase(),
        // ถ้า canAssign และเลือก assignee → ส่งไป, ไม่งั้น backend จะ assign ให้ตัวเอง
        ...(canAssign && newTask.assigneeId ? { assigneeId: newTask.assigneeId } : {}),
      });
      setShowCreateDialog(false);
      setNewTask(emptyNewTask);
      fetchTasks();
      toast.success('สร้าง task สำเร็จ!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'สร้าง task ไม่สำเร็จ');
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      date: task.date,
      priority: task.priority,
      status: task.status,
      assigneeId: '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !editForm.title || !editForm.date) {
      toast.error('กรุณากรอกชื่อ task และเลือกวันที่');
      return;
    }
    try {
      const statusMap: Record<string, string> = {
        'todo': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
      };
      await calendarService.updateTask(editingTaskId, {
        title: editForm.title,
        description: editForm.description,
        date: editForm.date,
        priority: editForm.priority.toUpperCase(),
        status: statusMap[editForm.status],
        ...(canAssign && editForm.assigneeId ? { assigneeId: editForm.assigneeId } : {}),
      });
      setShowEditDialog(false);
      setEditingTaskId(null);
      fetchTasks();
      toast.success('แก้ไข task สำเร็จ!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'แก้ไข task ไม่สำเร็จ');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await calendarService.deleteTask(taskId);
      fetchTasks();
      toast.success('ลบ task สำเร็จ!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบ task ไม่สำเร็จ');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <CalendarHeader
        tasks={tasks}
        onCreateTask={() => setShowCreateDialog(true)}
      />

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          tasks={tasks}
          onSelectDate={setSelectedDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={() => setCurrentDate(new Date())}
        />
        <TaskList
          tasks={tasks}
          selectedDate={selectedDate}
          selectedDateTasks={selectedDateTasks}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteTask}
        />
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newTask={newTask}
        onNewTaskChange={setNewTask}
        onCreate={handleCreateTask}
        canAssign={canAssign}
        members={members}
      />

      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editTask={editForm}
        onEditTaskChange={setEditForm}
        onUpdate={handleUpdateTask}
        canAssign={canAssign}
        members={members}
      />

    </div>
  );
}
