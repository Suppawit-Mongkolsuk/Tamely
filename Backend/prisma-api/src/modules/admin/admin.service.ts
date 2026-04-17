import { comparePassword } from '../../utils/password.hash';
import { signAdminToken } from '../../utils/jwt.utils';
import { AppError } from '../../types';
import * as adminRepository from './admin.repository';

const getAdminCredentials = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!username || !passwordHash) {
    throw new AppError(500, 'Admin login is not configured');
  }

  return { username, passwordHash };
};

const getAdminProfile = () => {
  const { username } = getAdminCredentials();
  return { username };
};

const assertAdminPassword = async (password: string) => {
  const credentials = getAdminCredentials();
  const passwordMatches = await comparePassword(password, credentials.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'Invalid admin password');
  }
};

export const loginAdmin = async (username: string, password: string) => {
  const credentials = getAdminCredentials();

  if (username !== credentials.username) {
    throw new AppError(401, 'Invalid admin credentials');
  }

  const passwordMatches = await comparePassword(password, credentials.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid admin credentials');
  }

  const admin = getAdminProfile();
  const token = signAdminToken(admin.username);

  return { token, admin };
};

export const getAdminSession = async () => {
  return getAdminProfile();
};

const getUsageStartDate = (range: '7d' | '30d' | 'all') => {
  if (range === 'all') {
    return undefined;
  }

  const now = new Date();
  const days = range === '7d' ? 7 : 30;
  now.setDate(now.getDate() - days);
  return now;
};

export const getWorkspaceDashboard = async (range: '7d' | '30d' | 'all' = 'all') => {
  const usageStartDate = getUsageStartDate(range);
  const [workspaces, aiUsage, auditLogs] = await Promise.all([
    adminRepository.findDashboardWorkspaces(),
    adminRepository.findAiUsageSummary(usageStartDate),
    adminRepository.findRecentAuditLogs(20),
  ]);

  const usageByWorkspace = new Map(
    aiUsage.map((item) => [
      item.workspaceId,
      {
        aiQueryCount: item._count._all,
        tokensUsed: item._sum.tokensUsed ?? 0,
        lastAiUsedAt: item._max.createdAt,
      },
    ]),
  );

  return {
    workspaces: workspaces.map((workspace) => {
      const usage = usageByWorkspace.get(workspace.id);

      return {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        iconUrl: workspace.iconUrl,
        inviteCode: workspace.inviteCode,
        isActive: workspace.isActive,
        blockedReason: workspace.blockedReason,
        blockedAt: workspace.blockedAt,
        blockedByAdminUsername: workspace.blockedByAdminUsername,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        owner: workspace.owner,
        memberCount: workspace._count.members,
        roomCount: workspace._count.rooms,
        aiQueryCount: usage?.aiQueryCount ?? 0,
        tokensUsed: usage?.tokensUsed ?? 0,
        lastAiUsedAt: usage?.lastAiUsedAt ?? null,
      };
    }),
    auditLogs,
    usageRange: range,
  };
};

export const updateWorkspaceStatus = async (
  workspaceId: string,
  isActive: boolean,
  adminUsername: string,
  reason?: string,
) => {
  const existingWorkspace = await adminRepository.findWorkspaceStatusById(workspaceId);

  if (!existingWorkspace) {
    throw new AppError(404, 'Workspace not found');
  }

  if (existingWorkspace.isActive === isActive) {
    throw new AppError(409, isActive ? 'Workspace is already active' : 'Workspace is already blocked');
  }

  if (!isActive && !reason?.trim()) {
    throw new AppError(400, 'Block reason is required');
  }

  const normalizedReason = reason?.trim() || null;

  return adminRepository.updateWorkspaceStatusWithAudit({
    workspaceId,
    workspaceName: existingWorkspace.name,
    previousIsActive: existingWorkspace.isActive,
    isActive,
    adminUsername,
    reason: normalizedReason,
  });
};

export const deleteWorkspaceAsAdmin = async (params: {
  workspaceId: string;
  workspaceName: string;
  password: string;
  adminUsername: string;
  reason?: string;
}) => {
  const existingWorkspace = await adminRepository.findWorkspaceStatusById(params.workspaceId);

  if (!existingWorkspace) {
    throw new AppError(404, 'Workspace not found');
  }

  if (params.workspaceName !== existingWorkspace.name) {
    throw new AppError(400, 'Workspace name confirmation does not match');
  }

  await assertAdminPassword(params.password);

  const normalizedReason = params.reason?.trim() || null;

  await adminRepository.deleteWorkspaceWithAudit({
    workspaceId: existingWorkspace.id,
    workspaceName: existingWorkspace.name,
    previousIsActive: existingWorkspace.isActive,
    adminUsername: params.adminUsername,
    reason: normalizedReason,
  });

  return {
    id: existingWorkspace.id,
    name: existingWorkspace.name,
    deleted: true as const,
  };
};
