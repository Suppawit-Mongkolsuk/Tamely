// ===== Header Component =====
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { navigation } from './Sidebar';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const currentNav = navigation.find((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <header className="bg-white border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="text-foreground text-base sm:text-lg truncate">
          {currentNav?.name || 'Home / Feed'}
        </h2>
      </div>
      <NotificationBell />
    </header>
  );
}
