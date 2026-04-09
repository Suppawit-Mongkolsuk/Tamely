// ===== Task List — Right sidebar =====
import {
  Calendar as CalendarIcon,
  Check,
  Circle,
  Sparkles,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor, monthNames } from '@/types/calendar-ui';
import type { Task } from '@/types/calendar-ui';

function getStatusIcon(status: string) {
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
}

interface TaskListProps {
  tasks: Task[];
  selectedDate: Date | null;
  selectedDateTasks: Task[];
}

export function TaskList({
  tasks,
  selectedDate,
  selectedDateTasks,
}: TaskListProps) {
  const displayTasks = selectedDate ? selectedDateTasks : tasks.slice(0, 10);

  return (
    <Card className="p-6">
      <h3 className="mb-4">
        {selectedDate
          ? `งานวันที่ ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
          : 'งานทั้งหมด'}
      </h3>

      <div className="space-y-3">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-lg border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-1">
                <div className="mt-1">{getStatusIcon(task.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-1 line-clamp-2">{task.title}</p>
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
