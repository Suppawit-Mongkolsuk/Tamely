// ===== Workspace Types =====

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    status: 'active' | 'inactive';
  };
}

export type WorkspaceMemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface JoinWorkspaceRequest {
  inviteCode: string;
}

export interface InviteMemberRequest {
  email: string;
  role: WorkspaceMemberRole;
}
