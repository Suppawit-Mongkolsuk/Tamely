"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const types_1 = require("../types");
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    // AppError — HTTP errors ที่ throw จาก service layer
    if (err instanceof types_1.AppError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    // JSON body พัง
    if (err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }
    // Validation
    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: err.message });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    // JWT
    if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
        return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    // Prisma
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res
                .status(409)
                .json({ success: false, error: 'Duplicate value (unique constraint)' });
        }
        if (err.code === 'P2025') {
            return res
                .status(404)
                .json({ success: false, error: 'Record not found' });
        }
        if (err.code === 'P2003') {
            return res
                .status(409)
                .json({ success: false, error: 'Foreign key constraint failed' });
        }
    }
    if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        return res
            .status(503)
            .json({ success: false, error: 'Database connection failed' });
    }
    // Fallback
    res.status(500).json({ success: false, error: 'Internal Server Error' });
}
//# sourceMappingURL=error.js.map