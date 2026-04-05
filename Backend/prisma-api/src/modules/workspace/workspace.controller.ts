import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as workspaceService from './workspace.service';
import {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateInviteCode,
  validateAddMember,
} from './workspace.validation';

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validation = validateCreateWorkspace(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    const workspace = await workspaceService.createWorkspace(
      req.userId!,
      req.body,
    );
    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create workspace';
    res.status(400).json({ success: false, error: message });
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.userId!);
    res.json({ success: true, data: workspaces });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list workspaces';
    res.status(500).json({ success: false, error: message });
  }
};

export const getById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const workspace = await workspaceService.getWorkspaceById(
      param(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data: workspace });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get workspace';
    res.status(404).json({ success: false, error: message });
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validation = validateUpdateWorkspace(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    const workspace = await workspaceService.updateWorkspace(
      param(req.params.id),
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: workspace });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update workspace';
    res.status(403).json({ success: false, error: message });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await workspaceService.deleteWorkspace(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete workspace';
    res.status(403).json({ success: false, error: message });
  }
};

export const getMembers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const members = await workspaceService.getMembers(
      param(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data: members });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get members';
    res.status(400).json({ success: false, error: message });
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validation = validateAddMember(req.body.email);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    const member = await workspaceService.addMemberByEmail(
      param(req.params.id),
      req.userId!,
      req.body.email,
      req.body.role,
    );
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add member';
    res.status(400).json({ success: false, error: message });
  }
};

export const joinWorkspace = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validation = validateInviteCode(req.body.inviteCode);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    const workspace = await workspaceService.joinByInviteCode(
      req.body.inviteCode,
      req.userId!,
    );
    res.json({ success: true, data: workspace });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to join workspace';
    res.status(400).json({ success: false, error: message });
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await workspaceService.removeMember(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
    );
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove member';
    res.status(403).json({ success: false, error: message });
  }
};

export const updateMemberRole = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const member = await workspaceService.updateMemberRole(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
      req.body,
    );
    res.json({ success: true, data: member });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update role';
    res.status(403).json({ success: false, error: message });
  }
};

export const regenerateInviteCode = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await workspaceService.regenerateInviteCode(
      param(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to regenerate code';
    res.status(403).json({ success: false, error: message });
  }
};
