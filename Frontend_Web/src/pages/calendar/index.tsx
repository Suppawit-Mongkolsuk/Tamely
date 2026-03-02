// ===== CalendarPage — Orchestrator =====
import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { TaskList } from './TaskList';
import { CreateTaskDialog, AICreateDialog, emptyNewTask } from './Dialogs';
import type { NewTaskForm } from './Dialogs';
import { getTasksForDate } from './types';
import type { Task } from './types';
import { mockTasks } from './mock-data';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTask, setNewTask] = useState<NewTaskForm>(emptyNewTask);

  // Derived
  const selectedDateTasks = getTasksForDate(tasks, selectedDate);

  // Handlers
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

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.date) {
      toast.error('กรุณากรอกชื่อ task และเลือกวันที่');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      date: newTask.date,
      priority: newTask.priority,
      status: 'todo',
      assignee: newTask.assignee,
      createdBy: 'user',
    };

    setTasks([...tasks, task]);
    setShowCreateDialog(false);
    setNewTask(emptyNewTask);
    toast.success('สร้าง task สำเร็จ!');
  };

  const handleAICreateTasks = () => {
    const aiTasks: Task[] = [
      {
        id: Date.now().toString(),
        title: 'Review pull requests from team members',
        description: 'AI detected 3 pending PRs that need review',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        assignee: 'John Doe',
        createdBy: 'ai',
      },
      {
        id: (Date.now() + 1).toString(),
        title: 'Follow up on client feedback',
        description:
          'AI analyzed chat history and found unresolved client questions',
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        priority: 'high',
        status: 'todo',
        assignee: 'John Doe',
        createdBy: 'ai',
      },
    ];

    setTasks([...tasks, ...aiTasks]);
    setShowAIDialog(false);
    toast.success(`AI สร้าง ${aiTasks.length} tasks ให้คุณแล้ว!`);
  };

  return (
    <div className="p-6 space-y-6">
      <CalendarHeader
        tasks={tasks}
        onCreateTask={() => setShowCreateDialog(true)}
        onAICreate={() => setShowAIDialog(true)}
      />

      {/* Main Content */}
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

      {/* Dialogs */}
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
