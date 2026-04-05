"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// Custom error class สำหรับจัดการ error ใน API
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
//# sourceMappingURL=common.types.js.map