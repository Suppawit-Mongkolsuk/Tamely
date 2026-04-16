export type WorkspacePermission =
  | 'MANAGE_WORKSPACE'
  | 'MANAGE_ROLES'
  | 'MANAGE_MEMBERS'
  | 'REGENERATE_INVITE'
  | 'MANAGE_CHANNELS'
  | 'VIEW_PRIVATE_CHANNELS'
  | 'SEND_MESSAGES'
  | 'DELETE_OWN_MESSAGES'
  | 'DELETE_ANY_MESSAGE'
  | 'CREATE_POST'
  | 'DELETE_ANY_POST'
  | 'PIN_POST'
  | 'DELETE_ANY_COMMENT'
  | 'CREATE_TASK'
  | 'ASSIGN_TASK'
  | 'DELETE_ANY_TASK'
  | 'USE_AI'
  | 'MENTION_ROLE';

export interface CustomRole {
  id: string;
  workspaceId?: string;
  name: string;
  color: string;
  position: number;
  permissions: WorkspacePermission[];
  createdAt?: string;
  updatedAt?: string;
}

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
  myPermissions?: WorkspacePermission[];
  myCustomRoles?: CustomRole[];
  memberCount?: number;
  roomCount?: number;
}

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  customRoles?: CustomRole[];
  user: {
    Name: string;
    email?: string;
    avatarUrl?: string | null;
    lastSeenAt?: string | null;
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
