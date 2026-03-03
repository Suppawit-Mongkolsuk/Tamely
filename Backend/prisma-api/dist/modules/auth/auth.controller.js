"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jwt_utils_1 = require("../../utils/jwt.utils");
const auth_validation_1 = require("./auth.validation");
const authService = __importStar(require("./auth.service"));
/**
 * POST /api/auth/register
 * สมัครสมาชิก
 */
const register = async (req, res) => {
    try {
        // 1. Validate input
        const validation = (0, auth_validation_1.validateRegisterInput)(req.body.email, req.body.password, req.body.displayName);
        if (!validation.valid) {
            res.status(400).json({ success: false, error: validation.message });
            return;
        }
        // 2. Register user (service)
        const user = await authService.registerUser(req.body);
        // 3. Create token
        const token = (0, jwt_utils_1.signToken)(user.id);
        // 4. Set cookie
        (0, jwt_utils_1.setTokenCookie)(res, token);
        // 5. Return response
        const response = {
            token,
            user,
        };
        res.status(201).json({ success: true, data: response });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({ success: false, error: message });
    }
};
exports.register = register;
/**
 * POST /api/auth/login
 * เข้าสู่ระบบ
 */
const login = async (req, res) => {
    try {
        // 1. Validate input
        const validation = (0, auth_validation_1.validateLoginInput)(req.body);
        if (!validation.valid) {
            res.status(400).json({ success: false, error: validation.message });
            return;
        }
        // 2. Login user (service)
        const user = await authService.loginUser(req.body);
        // 3. Create token
        const token = (0, jwt_utils_1.signToken)(user.id);
        // 4. Set cookie
        (0, jwt_utils_1.setTokenCookie)(res, token);
        // 5. Return response
        const response = {
            token,
            user,
        };
        res.json({ success: true, data: response });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ success: false, error: message });
    }
};
exports.login = login;
/**
 * POST /api/auth/logout
 * ออกจากระบบ
 */
const logout = (req, res) => {
    try {
        (0, jwt_utils_1.clearTokenCookie)(res);
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        res.status(400).json({ success: false, error: message });
    }
};
exports.logout = logout;
/**
 * GET /api/auth/me
 * ดูข้อมูลตัวเอง (ต้อง login)
 */
const getMe = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const user = await authService.getUserById(req.userId);
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch user';
        res.status(404).json({ success: false, error: message });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map