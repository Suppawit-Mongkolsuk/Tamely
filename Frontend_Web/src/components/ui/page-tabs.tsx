// ===== PageTabs — Reusable Tab Navigation Component =====
// ใช้เป็น tab nav ด้านบนหน้าต่างๆ เช่น Settings, Management

import { cn } from './utils';

export interface PageTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface PageTabsProps {
  tabs: PageTab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function PageTabs({ tabs, activeTab, onChange, className }: PageTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
