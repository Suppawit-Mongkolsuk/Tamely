import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as workspaceController from './workspace.controller';

const router = Router();

router.use(authenticate);

router.post('/', workspaceController.create);
router.get('/', workspaceController.list);
router.post('/join', workspaceController.joinWorkspace);

router.get('/:id', workspaceController.getById);
router.patch('/:id', workspaceController.update);
router.delete('/:id', workspaceController.remove);

router.get('/:id/members', workspaceController.getMembers);
router.post('/:id/members', workspaceController.addMember);
router.delete('/:id/members/:userId', workspaceController.removeMember);
router.patch('/:id/members/:userId', workspaceController.updateMemberRole);

router.post('/:id/regenerate-invite', workspaceController.regenerateInviteCode);

export default router;
