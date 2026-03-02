// ===== Header Component =====
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { navigation } from './Sidebar';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const currentNav = navigation.find((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Menu className="size-5" />
      </button>
      <div className="flex-1">
        <h2 className="text-foreground">{currentNav?.name || 'Home / Feed'}</h2>
      </div>
    </header>
  );
}
