import { Router, Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler, validateRequest } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import * as customRoleService from './custom-role.service';
import {
  AssignCustomRoleSchema,
  CreateCustomRoleSchema,
  DeleteCustomRoleSchema,
  ListCustomRolesSchema,
  MemberCustomRolesSchema,
  ReorderCustomRolesSchema,
  RevokeCustomRoleSchema,
  UpdateCustomRoleSchema,
} from './custom-role.model';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

router.get(
  '/workspaces/:id/roles',
  validateRequest(ListCustomRolesSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const roles = await customRoleService.listCustomRoles(param(req.params.id), req.userId!);
    res.json({ success: true, data: roles });
  }),
);

router.post(
  '/workspaces/:id/roles',
  validateRequest(CreateCustomRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const role = await customRoleService.createCustomRole(param(req.params.id), req.userId!, req.body);
    res.status(201).json({ success: true, data: role });
  }),
);

router.patch(
  '/workspaces/:id/roles/reorder',
  validateRequest(ReorderCustomRolesSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const roles = await customRoleService.reorderCustomRoles(param(req.params.id), req.userId!, req.body.roleIds);
    res.json({ success: true, data: roles });
  }),
);

router.patch(
  '/workspaces/:id/roles/:roleId',
  validateRequest(UpdateCustomRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const role = await customRoleService.updateCustomRole(
      param(req.params.id),
      req.userId!,
      param(req.params.roleId),
      req.body,
    );
    res.json({ success: true, data: role });
  }),
);

router.delete(
  '/workspaces/:id/roles/:roleId',
  validateRequest(DeleteCustomRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await customRoleService.deleteCustomRole(param(req.params.id), req.userId!, param(req.params.roleId));
    res.json({ success: true, message: 'Custom role deleted' });
  }),
);

router.get(
  '/workspaces/:id/members/:userId/roles',
  validateRequest(MemberCustomRolesSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const roles = await customRoleService.getMemberCustomRoles(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
    );
    res.json({ success: true, data: roles });
  }),
);

router.post(
  '/workspaces/:id/members/:userId/roles',
  validateRequest(AssignCustomRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await customRoleService.assignCustomRole(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
      req.body.roleId,
    );
    res.status(201).json({ success: true });
  }),
);

router.delete(
  '/workspaces/:id/members/:userId/roles/:roleId',
  validateRequest(RevokeCustomRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await customRoleService.revokeCustomRole(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
      param(req.params.roleId),
    );
    res.json({ success: true });
  }),
);

export default router;
