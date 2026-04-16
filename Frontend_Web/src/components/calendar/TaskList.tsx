// ===== Task List — Right sidebar =====
import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  Circle,
  Sparkles,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { monthNames } from '@/types/calendar-ui';
import type { Task } from '@/types/calendar-ui';

type StatusFilter = 'all' | 'todo' | 'in-progress' | 'completed';

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'เสร็จแล้ว';
    case 'in-progress':
      return 'กำลังทำ';
    default:
      return 'รอดำเนินการ';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Check className="size-3" />;
    case 'in-progress':
      return <Circle className="size-3 fill-current" />;
    default:
      return <Circle className="size-3" />;
  }
}

function formatTaskDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${monthNames[month - 1]} ${year + 543}`;
}

interface TaskListProps {
  tasks: Task[];
  selectedDate: Date | null;
  selectedDateTasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({
  tasks,
  selectedDate,
  selectedDateTasks,
  onEdit,
  onDelete,
}: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const baseTasks = selectedDate ? selectedDateTasks : tasks.slice(0, 10);
  const displayTasks =
    statusFilter === 'all'
      ? baseTasks
      : baseTasks.filter((t) => t.status === statusFilter);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        {selectedDate ? (
          <h3>{`งานวันที่ ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`}</h3>
        ) : (
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40 h-8 text-sm font-medium border-none shadow-none px-3 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">งานทั้งหมด</SelectItem>
              <SelectItem value="todo">รอดำเนินการ</SelectItem>
              <SelectItem value="in-progress">กำลังทำ</SelectItem>
              <SelectItem value="completed">เสร็จแล้ว</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-3">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-lg border hover:shadow-md transition-shadow ${
              task.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50/60'
                : task.status === 'in-progress'
                  ? 'border-orange-200 bg-orange-50/60'
                  : 'border-red-200 bg-red-50/60'
            }`}
          >
            {/* Row 1: status + title + 3-dot */}
            <div className="flex items-start gap-2">
              <div className="mt-1 shrink-0">{getStatusIcon(task.status)}</div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm mb-0.5 line-clamp-2 ${
                    task.status === 'completed'
                      ? 'line-through text-emerald-900/70'
                      : ''
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted transition-colors shrink-0 -mt-0.5">
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="size-3.5 mr-2" />
                    แก้ไข
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    ลบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2: badges */}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(task.status)}`}
              >
                {getStatusLabel(task.status)}
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

            {/* Row 3: date + assigned by */}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3" />
                <span>{formatTaskDate(task.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="size-3" />
                <span>{task.assignedBy}</span>
              </div>
            </div>
          </div>
        ))}

        {displayTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="size-12 mx-auto mb-3 opacity-30" />
            <p>ไม่มีงานในวันนี้</p>
          </div>
        )}
      </div>
    </Card>
  );
}
