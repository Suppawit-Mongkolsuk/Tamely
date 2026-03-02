import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  AlertCircle,
  User,
  Clock,
  Filter,
  Download,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  assignee: string;
  createdBy: 'user' | 'ai';
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Mock tasks data
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete API integration for payment gateway',
      description: 'Integrate Stripe payment system',
      date: '2026-01-28',
      priority: 'high',
      status: 'in-progress',
      assignee: 'John Doe',
      createdBy: 'user',
    },
    {
      id: '2',
      title: 'Review and approve new brand guidelines',
      description: 'Check new design system documentation',
      date: '2026-01-30',
      priority: 'medium',
      status: 'todo',
      assignee: 'Jane Smith',
      createdBy: 'user',
    },
    {
      id: '3',
      title: 'Prepare Q1 product roadmap presentation',
      description: 'Create slides for stakeholder meeting',
      date: '2026-02-01',
      priority: 'high',
      status: 'todo',
      assignee: 'John Doe',
      createdBy: 'ai',
    },
    {
      id: '4',
      title: 'Update user documentation',
      description: 'Add new features to help center',
      date: '2026-01-31',
      priority: 'low',
      status: 'completed',
      assignee: 'Sarah Johnson',
      createdBy: 'user',
    },
    {
      id: '5',
      title: 'Team standup meeting',
      description: 'Daily sync with engineering team',
      date: '2026-02-03',
      priority: 'medium',
      status: 'todo',
      assignee: 'Team',
      createdBy: 'ai',
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    assignee: 'John Doe',
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => task.date === dateStr);
  };

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
    setNewTask({
      title: '',
      description: '',
      date: '',
      priority: 'medium',
      assignee: 'John Doe',
    });
    toast.success('สร้าง task สำเร็จ!');
  };

  const handleAICreateTasks = () => {
    // Simulate AI creating tasks
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="size-3" />;
      case 'in-progress':
        return <Circle className="size-3 fill-current" />;
      case 'todo':
        return <Circle className="size-3" />;
      default:
        return <Circle className="size-3" />;
    }
  };

  const monthNames = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const days = getDaysInMonth(currentDate);
  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">ปฏิทิน & งาน</h1>
          <p className="text-muted-foreground">
            จัดการ tasks และติดตามความคืบหน้าของทีม
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" />
            กรอง
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
            onClick={() => setShowAIDialog(true)}
          >
            <Sparkles className="size-4 mr-2" />
            AI สร้าง Tasks
          </Button>
          <Button
            className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="size-4 mr-2" />
            สร้าง Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">งานทั้งหมด</p>
              <p className="text-2xl">{tasks.length}</p>
            </div>
            <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="size-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                กำลังดำเนินการ
              </p>
              <p className="text-2xl">
                {tasks.filter((t) => t.status === 'in-progress').length}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="size-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">เสร็จสิ้น</p>
              <p className="text-2xl">
                {tasks.filter((t) => t.status === 'completed').length}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="size-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">AI สร้าง</p>
              <p className="text-2xl">
                {tasks.filter((t) => t.createdBy === 'ai').length}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="size-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">
              {monthNames[currentDate.getMonth()]}{' '}
              {currentDate.getFullYear() + 543}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                วันนี้
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day names */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const dayTasks = day ? getTasksForDate(day) : [];
              const isToday =
                day && day.toDateString() === new Date().toDateString();
              const isSelected =
                day &&
                selectedDate &&
                day.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`min-h-24 p-2 rounded-lg border transition-all ${
                    !day
                      ? 'bg-muted/30 cursor-default'
                      : isSelected
                        ? 'bg-[#5EBCAD]/10 border-[#5EBCAD]'
                        : isToday
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-muted border-border'
                  }`}
                  disabled={!day}
                >
                  {day && (
                    <div className="text-left h-full flex flex-col">
                      <span
                        className={`text-sm mb-1 ${
                          isToday
                            ? 'font-bold text-blue-600'
                            : 'text-foreground'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="space-y-1 flex-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {task.title.substring(0, 15)}...
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayTasks.length - 2} เพิ่มเติม
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Task List */}
        <Card className="p-6">
          <h3 className="mb-4">
            {selectedDate
              ? `งานวันที่ ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
              : 'งานทั้งหมด'}
          </h3>

          <div className="space-y-3">
            {(selectedDate ? selectedDateTasks : tasks.slice(0, 10)).map(
              (task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="mt-1">{getStatusIcon(task.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1 line-clamp-2">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    {task.createdBy === 'ai' && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <Sparkles className="size-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <User className="size-3" />
                    <span>{task.assignee}</span>
                  </div>
                </div>
              ),
            )}

            {(selectedDate ? selectedDateTasks : tasks).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="size-12 mx-auto mb-3 opacity-30" />
                <p>ไม่มีงานในวันนี้</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                  setNewTask({ ...newTask, title: e.target.value })
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
                  setNewTask({ ...newTask, description: e.target.value })
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
                    setNewTask({ ...newTask, date: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="task-priority">ความสำคัญ</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: 'high' | 'medium' | 'low') =>
                    setNewTask({ ...newTask, priority: value })
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
                  setNewTask({ ...newTask, assignee: value })
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
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
                onClick={handleCreateTask}
              >
                สร้าง Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Create Tasks Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
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
                    <span className="font-medium">
                      Follow up client feedback
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ติดตามคำถามจากลูกค้าที่ยังไม่ได้ตอบ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
                onClick={handleAICreateTasks}
              >
                <Sparkles className="size-4 mr-2" />
                ให้ AI สร้าง Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
