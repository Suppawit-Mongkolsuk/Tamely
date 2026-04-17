export interface AdminUser {
  username: string;
}

export interface AdminAuthResponseData {
  token: string;
  admin: AdminUser;
}

export interface AdminWorkspaceAuditLog {
  id: string;
  workspaceId?: string | null;
  workspaceNameSnapshot: string;
  action: 'BLOCK' | 'UNBLOCK' | 'DELETE';
  adminUsername: string;
  reason?: string | null;
  previousIsActive: boolean;
  nextIsActive: boolean;
  createdAt: string;
}

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  inviteCode: string;
  isActive: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  blockedByAdminUsername?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    Name: string;
    email: string;
  };
  memberCount: number;
  roomCount: number;
  aiQueryCount: number;
  tokensUsed: number;
  lastAiUsedAt?: string | null;
}

export interface AdminDashboardResponseData {
  workspaces: AdminWorkspaceSummary[];
  auditLogs: AdminWorkspaceAuditLog[];
  usageRange: '7d' | '30d' | 'all';
}

export interface AdminWorkspaceDeleteResponse {
  id: string;
  name: string;
  deleted: true;
}
