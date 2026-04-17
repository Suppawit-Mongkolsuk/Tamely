"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
// Middleware ตรวจสอบ JWT token
const authenticate = (req, res, next) => {
    try {
        // ดึง token จาก Cookie
        let token = (0, jwt_utils_1.getTokenFromCookie)(req.cookies);
        // ถ้าไม่มี ลองดึงจาก Authorization header
        if (!token) {
            token = (0, jwt_utils_1.extractToken)(req.headers.authorization);
        }
        // ถ้าไม่มี token เลย
        if (!token) {
            res.status(401).json({ success: false, error: 'No token provided' });
            return;
        }
        // ตรวจสอบ token
        const payload = (0, jwt_utils_1.verifyToken)(token);
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.authenticate = authenticate;
const authenticateAdmin = (req, res, next) => {
    try {
        let token = (0, jwt_utils_1.getAdminTokenFromCookie)(req.cookies);
        if (!token) {
            token = (0, jwt_utils_1.extractToken)(req.headers.authorization);
        }
        if (!token) {
            res.status(401).json({ success: false, error: 'No admin token provided' });
            return;
        }
        const payload = (0, jwt_utils_1.verifyAdminToken)(token);
        req.adminUsername = payload.username;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired admin token',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.authenticateAdmin = authenticateAdmin;
//# sourceMappingURL=auth.js.map