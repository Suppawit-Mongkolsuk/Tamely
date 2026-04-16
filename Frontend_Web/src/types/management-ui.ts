// ===== Management Page Types =====
import type { CustomRole, WorkspaceMemberRole } from '@/types';

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: WorkspaceMemberRole;
  customRoles?: CustomRole[];
  status?: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
  avatarUrl?: string | null;
  isCurrentUser?: boolean;
  lastSeenAt?: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: number;
  privacy: 'public' | 'private';
  created: string;
}

export type Role = CustomRole;
