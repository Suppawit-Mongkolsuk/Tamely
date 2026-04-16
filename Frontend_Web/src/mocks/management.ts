// ===== Management Page Mock Data =====
import type { TeamMember, Room, Role } from '@/types/management-ui';

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    role: 'ADMIN',
    status: 'active',
    joinDate: 'Jan 2024',
    avatar: 'SJ',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.c@company.com',
    role: 'MODERATOR',
    status: 'active',
    joinDate: 'Feb 2024',
    avatar: 'MC',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.w@company.com',
    role: 'MEMBER',
    status: 'active',
    joinDate: 'Jan 2024',
    avatar: 'EW',
  },
  {
    id: '4',
    name: 'John Doe',
    email: 'john.d@company.com',
    role: 'ADMIN',
    status: 'active',
    joinDate: 'Dec 2023',
    avatar: 'JD',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.a@company.com',
    role: 'MEMBER',
    status: 'inactive',
    joinDate: 'Mar 2024',
    avatar: 'LA',
  },
];

export const mockRooms: Room[] = [
  {
    id: '1',
    name: 'General',
    description: 'Main discussion channel',
    members: 24,
    messages: 542,
    privacy: 'public',
    created: '3 months ago',
  },
  {
    id: '2',
    name: 'Code Reviews',
    description: 'Share and review code',
    members: 18,
    messages: 324,
    privacy: 'private',
    created: '2 months ago',
  },
  {
    id: '3',
    name: 'Design Reviews',
    description: 'Design feedback and critiques',
    members: 12,
    messages: 456,
    privacy: 'public',
    created: '4 months ago',
  },
  {
    id: '4',
    name: 'Marketing',
    description: 'Marketing campaigns and strategy',
    members: 15,
    messages: 289,
    privacy: 'private',
    created: '2 months ago',
  },
];

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    color: '#F59E0B',
    position: 4,
    permissions: ['MANAGE_WORKSPACE', 'MANAGE_MEMBERS', 'MANAGE_CHANNELS', 'MANAGE_ROLES'],
  },
  {
    id: '2',
    name: 'Moderator',
    color: '#3B82F6',
    position: 3,
    permissions: ['MANAGE_CHANNELS', 'DELETE_ANY_MESSAGE', 'DELETE_ANY_COMMENT'],
  },
  {
    id: '3',
    name: 'Member',
    color: '#6B7280',
    position: 2,
    permissions: ['SEND_MESSAGES', 'CREATE_TASK'],
  },
  {
    id: '4',
    name: 'Guest',
    color: '#9CA3AF',
    position: 1,
    permissions: [],
  },
];
