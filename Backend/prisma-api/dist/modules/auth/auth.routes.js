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
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validate_1 = require("../../middlewares/validate");
const jwt_utils_1 = require("../../utils/jwt.utils");
const auth_model_1 = require("./auth.model");
const authService = __importStar(require("./auth.service"));
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', (0, validate_1.validateRequest)(auth_model_1.RegisterSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await authService.registerUser(req.body);
    const token = (0, jwt_utils_1.signToken)(user.id);
    (0, jwt_utils_1.setTokenCookie)(res, token);
    const response = { token, user };
    res.status(201).json({ success: true, data: response });
}));
// POST /api/auth/login
router.post('/login', (0, validate_1.validateRequest)(auth_model_1.LoginSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await authService.loginUser(req.body);
    const rememberMe = Boolean(req.body.rememberMe);
    const token = (0, jwt_utils_1.signToken)(user.id, rememberMe);
    (0, jwt_utils_1.setTokenCookie)(res, token, rememberMe);
    const response = { token, user };
    res.json({ success: true, data: response });
}));
// POST /api/auth/logout
router.post('/logout', (req, res) => {
    (0, jwt_utils_1.clearTokenCookie)(res);
    res.json({ success: true, message: 'Logged out successfully' });
});
// GET /api/auth/me
router.get('/me', auth_1.authenticate, (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    res.status(200).json({ success: true, data: user });
}));
// GET /api/auth/token — คืน fresh token สำหรับ Socket auth (ใช้ตอน page refresh)
router.get('/token', auth_1.authenticate, (0, validate_1.asyncHandler)(async (req, res) => {
    const token = (0, jwt_utils_1.signToken)(req.userId);
    (0, jwt_utils_1.setTokenCookie)(res, token);
    res.json({ success: true, data: { token } });
}));
// POST /api/auth/forgot-password
router.post('/forgot-password', (0, validate_1.validateRequest)(auth_model_1.ForgotPasswordSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
}));
// POST /api/auth/reset-password
router.post('/reset-password', (0, validate_1.validateRequest)(auth_model_1.ResetPasswordSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json({ success: true, data: result });
}));
// PATCH /api/auth/profile
router.patch('/profile', auth_1.authenticate, (0, validate_1.asyncHandler)(async (req, res) => {
    const { displayName, bio } = req.body;
    const user = await authService.updateProfile(req.userId, { displayName, bio });
    res.json({ success: true, data: user });
}));
// POST /api/auth/avatar
router.post('/avatar', auth_1.authenticate, upload_middleware_1.avatarUpload.single('avatar'), (0, validate_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
    }
    const user = await authService.updateUserAvatar(req.userId, file.buffer, file.mimetype, file.originalname);
    res.json({ success: true, data: user });
}));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map