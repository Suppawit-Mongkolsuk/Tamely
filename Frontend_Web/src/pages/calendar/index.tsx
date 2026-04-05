import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { TaskList } from './TaskList';
import { CreateTaskDialog, AICreateDialog, emptyNewTask } from './Dialogs';
import type { NewTaskForm } from './Dialogs';
import { getTasksForDate } from './types';
import type { Task } from './types';
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
    <div className="p-6 space-y-6">
      <CalendarHeader
        tasks={tasks}
        onCreateTask={() => setShowCreateDialog(true)}
        onAICreate={() => setShowAIDialog(true)}
      />

      <div className="grid lg:grid-cols-3 gap-6">
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
