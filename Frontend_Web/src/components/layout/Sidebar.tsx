// ===== Sidebar Component =====
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Brain,
  FolderKanban,
  Settings,
  Calendar,
  LogOut,
} from 'lucide-react';

const navigation = [
  { id: 'home', path: '/home', name: 'Home / Feed', icon: Home },
  {
    id: 'chat-rooms',
    path: '/chat-rooms',
    name: 'Chat Rooms',
    icon: MessageSquare,
  },
  { id: 'ai-chat', path: '/ai-chat', name: 'AI Chat', icon: Brain },
  { id: 'calendar', path: '/calendar', name: 'Calendar', icon: Calendar },
  {
    id: 'management',
    path: '/management',
    name: 'Workspace Management',
    icon: FolderKanban,
  },
  { id: 'settings', path: '/settings', name: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-0'
      } transition-all duration-300 bg-[#003366] text-white flex flex-col overflow-hidden`}
    >
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-white">TamelyChat</h1>
        <p className="text-sm text-white/70 mt-1">AI-Powered Workspace</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#174978] text-white'
                  : 'text-white/70 hover:bg-[#174978]/50 hover:text-white'
              }`}
            >
              <Icon className="size-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#5EBCAD] flex items-center justify-center">
            <span>JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">John Doe</p>
            <p className="text-xs text-white/60">Admin</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { navigation };
