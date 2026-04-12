import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { TaskList } from '@/components/calendar/TaskList';
import { CreateTaskDialog, AICreateDialog, emptyNewTask } from '@/components/calendar/Dialogs';
import type { NewTaskForm } from '@/components/calendar/Dialogs';
import { getTasksForDate } from '@/types/calendar-ui';
import type { Task } from '@/types/calendar-ui';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { calendarService } from '@/services/calendar.service';
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
    createdBy: t.createdBy.toLowerCase() as Task['createdBy'],
  };
}

export function CalendarPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const wsId = currentWorkspace?.id;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTaskForm>(emptyNewTask);

  const selectedDateTasks = getTasksForDate(tasks, selectedDate);

  const fetchTasks = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await calendarService.getTasks(wsId, {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      setTasks(data.map(mapTask));
    } catch {
      toast.error('โหลด task ไม่สำเร็จ');
    }
  }, [wsId, currentDate]);

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
      });
      setShowCreateDialog(false);
      setNewTask(emptyNewTask);
      fetchTasks();
      toast.success('สร้าง task สำเร็จ!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'สร้าง task ไม่สำเร็จ');
    }
  };

  const handleAICreateTasks = () => {
    setShowAIDialog(false);
    toast.info('AI task creation will be available soon');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <CalendarHeader
        tasks={tasks}
        onCreateTask={() => setShowCreateDialog(true)}
        onAICreate={() => setShowAIDialog(true)}
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
        />
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newTask={newTask}
        onNewTaskChange={setNewTask}
        onCreate={handleCreateTask}
      />

      <AICreateDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onConfirm={handleAICreateTasks}
      />
    </div>
  );
}
