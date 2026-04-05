"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorkspaceOwner = exports.requireWorkspaceAdmin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * ตรวจสอบว่า user เป็น admin ของ workspace ไหม
 * @param req - Request (ต้องมี req.userId)
 * @param res - Response
 * @param next - NextFunction
 */
const requireWorkspaceAdmin = async (req, res, next) => {
    try {
        const workspaceId = req.params.workspaceId || req.query.workspaceId;
        if (!workspaceId) {
            res.status(400).json({ success: false, error: 'Workspace ID required' });
            return;
        }
        // ดึง workspace member data
        const member = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: workspaceId,
                    userId: req.userId,
                },
            },
        });
        // เช็ค role
        if (!member || member.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'You must be an admin to perform this action',
            });
            return;
        }
        // เป็น admin → อนุญาต
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authorization check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.requireWorkspaceAdmin = requireWorkspaceAdmin;
// ตรวจสอบว่า role
const requireWorkspaceOwner = async (req, res, next) => {
    try {
        const workspaceId = req.params.workspaceId || req.query.workspaceId;
        if (!workspaceId) {
            res.status(400).json({ success: false, error: 'Workspace ID required' });
            return;
        }
        // ดึง workspace data
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        // เช็ค owner
        if (!workspace || workspace.ownerId !== req.userId) {
            res.status(403).json({
                success: false,
                error: 'You must be the owner to perform this action',
            });
            return;
        }
        // เป็น owner → อนุญาต
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authorization check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.requireWorkspaceOwner = requireWorkspaceOwner;
//# sourceMappingURL=authorize.js.map