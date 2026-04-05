export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: WorkspaceMemberRole;
  memberCount?: number;
  roomCount?: number;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  user: {
    id: string;
    Name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface JoinWorkspaceRequest {
  inviteCode: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: WorkspaceMemberRole;
}
