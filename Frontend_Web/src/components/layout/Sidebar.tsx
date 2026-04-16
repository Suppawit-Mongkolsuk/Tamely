import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Brain,
  FolderKanban,
  Settings,
  Calendar,
  ChevronDown,
  Users,
  Hash,
  Cog,
} from 'lucide-react';
import { useAuthContext } from '@/contexts';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useUnreadDMs } from '@/hooks';
import { canAny, canDo, PERMISSIONS } from '@/lib/permissions';

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
    children: [
      { id: 'management-members', path: '/management/members', name: 'จัดการสมาชิก', icon: Users },
      { id: 'management-rooms', path: '/management/rooms', name: 'จัดการห้อง', icon: Hash },
      { id: 'management-workspace', path: '/management/workspace', name: 'ตั้งค่า Workspace', icon: Cog },
    ],
  },
  { id: 'settings', path: '/settings', name: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  onLogout: () => void;
  onNavigate?: () => void; // เรียกหลัง navigate (ใช้ปิด drawer บนมือถือ)
}

export function Sidebar({ isOpen, isMobile = false, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { currentWorkspace } = useWorkspaceContext();
  const { totalUnread } = useUnreadDMs();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    management: location.pathname.startsWith('/management'),
  });
  const canAccessManagement = canAny(currentWorkspace, [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_CHANNELS,
    PERMISSIONS.MANAGE_WORKSPACE,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.REGENERATE_INVITE,
  ]);

  // filter sub-items ตาม permission ของแต่ละคน
  const visibleManagementChildren = [
    canDo(currentWorkspace, PERMISSIONS.MANAGE_MEMBERS) && 'management-members',
    canDo(currentWorkspace, PERMISSIONS.MANAGE_CHANNELS) && 'management-rooms',
    canAny(currentWorkspace, [
      PERMISSIONS.MANAGE_WORKSPACE,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.REGENERATE_INVITE,
    ]) && 'management-workspace',
  ].filter(Boolean) as string[];

  const displayName = user?.displayName ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  useEffect(() => {
    if (location.pathname.startsWith('/management')) {
      setExpandedMenus((prev) => ({ ...prev, management: true }));
    }
  }, [location.pathname]);

  // Mobile: fixed overlay (slide in/out)
  // Desktop: relative push content (collapse to w-0)
  const positionClass = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `relative ${isOpen ? 'w-64' : 'w-0'}`;

  return (
    <aside
      className={`${positionClass} transition-all duration-300 bg-[#003366] text-white flex flex-col overflow-hidden shrink-0`}
    >
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-white">TamelyChat</h1>
        <p className="text-sm text-white/70 mt-1">AI-Powered Workspace</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => (item.id === 'management' ? canAccessManagement : true))
          .map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isActive = hasChildren
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;
          const isChatRooms = item.id === 'chat-rooms';
          // แสดง badge เฉพาะ Chat Rooms และมี unread DM และไม่ได้อยู่หน้านั้น
          const showBadge = isChatRooms && totalUnread > 0 && !isActive;
          const isExpanded = expandedMenus[item.id] ?? false;

          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() =>
                    setExpandedMenus((prev) => ({
                      ...prev,
                      [item.id]: !isExpanded,
                    }))
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#174978] text-white'
                      : 'text-white/70 hover:bg-[#174978]/50 hover:text-white'
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="ml-6 pl-3 border-l border-white/10 space-y-1">
                    {item.children!.filter((child) =>
                      item.id !== 'management' || visibleManagementChildren.includes(child.id)
                    ).map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path;

                      return (
                        <button
                          key={child.id}
                          onClick={() => handleNavigate(child.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isChildActive
                              ? 'bg-white/10 text-white'
                              : 'text-white/65 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <ChildIcon className="size-4 shrink-0" />
                          <span className="flex-1 text-left truncate">{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#174978] text-white'
                  : 'text-white/70 hover:bg-[#174978]/50 hover:text-white'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="flex-1 text-left truncate">{item.name}</span>
              {/* Unread badge ด้านขวา — แสดงเฉพาะ Chat Rooms เมื่อไม่ได้อยู่หน้านั้น */}
              {showBadge && (
                <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => handleNavigate('/settings')}
          className="w-full flex items-center gap-3 rounded-lg hover:bg-white/10 transition-colors p-1"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="size-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-10 rounded-full bg-[#5EBCAD] flex items-center justify-center shrink-0">
              <span>{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm truncate">{displayName}</p>
            <p className="text-xs text-white/60 truncate">{user?.email ?? ''}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

export { navigation };
