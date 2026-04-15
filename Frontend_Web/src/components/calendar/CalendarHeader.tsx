// ===== Calendar Header — Stats + Action Buttons =====
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/calendar-ui';

interface CalendarHeaderProps {
  tasks: Task[];
  onCreateTask: () => void;
  onAICreate: () => void;
}

export function CalendarHeader({
  tasks,
  onCreateTask,
  onAICreate,
}: CalendarHeaderProps) {
  return (
    <>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-foreground mb-1 text-lg sm:text-xl">ปฏิทิน & งาน</h1>
          <p className="text-muted-foreground text-sm">
            จัดการ tasks และติดตามความคืบหน้าของทีม
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            className="bg-[#75A2BF] hover:bg-[#75A2BF]/90"
            size="sm"
            onClick={onAICreate}
          >
            <Sparkles className="size-4 mr-1 sm:mr-2" />
            AI สร้าง
          </Button>
          <Button
            className="bg-[#5EBCAD] hover:bg-[#5EBCAD]/90"
            size="sm"
            onClick={onCreateTask}
          >
            <Plus className="size-4 mr-1 sm:mr-2" />
            สร้าง Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
    </>
  );
}
