// ===== Calendar Grid — Month View =====
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDaysInMonth, getTasksForDate, monthNames, dayNames } from '@/types/calendar-ui';
import type { Task } from '@/types/calendar-ui';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarGrid({
  currentDate,
  selectedDate,
  tasks,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarGridProps) {
  const days = getDaysInMonth(currentDate);

  return (
    <Card className="lg:col-span-2 p-3 sm:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            วันนี้
          </Button>
          <Button variant="outline" size="sm" onClick={onNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day names */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm text-muted-foreground py-1 sm:py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayTasks = day ? getTasksForDate(tasks, day) : [];
          const isToday =
            day && day.toDateString() === new Date().toDateString();
          const isSelected =
            day &&
            selectedDate &&
            day.toDateString() === selectedDate.toDateString();

          return (
            <button
              key={index}
              onClick={() => day && onSelectDate(day)}
              className={`min-h-12 sm:min-h-24 p-1 sm:p-2 rounded-lg border transition-all ${
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
                    className={`text-xs sm:text-sm mb-0.5 sm:mb-1 ${
                      isToday ? 'font-bold text-blue-600' : 'text-foreground'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {/* Task previews — hidden on small screens, show dots instead */}
                  <div className="space-y-0.5 sm:space-y-1 flex-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs p-0.5 sm:p-1 rounded truncate hidden sm:block ${
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
                    {/* Mobile: show colored dots */}
                    {dayTasks.length > 0 && (
                      <div className="flex gap-0.5 justify-center sm:hidden">
                        {dayTasks.slice(0, 3).map((task) => (
                          <span
                            key={task.id}
                            className={`size-1.5 rounded-full ${
                              task.priority === 'high'
                                ? 'bg-red-500'
                                : task.priority === 'medium'
                                  ? 'bg-orange-500'
                                  : 'bg-blue-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground hidden sm:block">
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
  );
}
