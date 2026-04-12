"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
/**
 * Hash password
 * @param plainText
 * @returns
 */
const hashPassword = async (plainText) => {
    try {
        return await bcrypt_1.default.hash(plainText, SALT_ROUNDS);
    }
    catch (error) {
        throw new Error('Failed to hash password');
    }
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 * @param plainText
 * @param hash
 * @returns
 */
const comparePassword = async (plainText, hash) => {
    try {
        return await bcrypt_1.default.compare(plainText, hash);
    }
    catch (error) {
        throw new Error('Failed to compare password');
    }
};
exports.comparePassword = comparePassword;
/**
 * Validate password strength
 * @param password - Password to validate
 * @returns { valid: boolean, error?: string }
 */
const validatePasswordStrength = (password) => {
    // Check length
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }
    // Check uppercase
    if (!/[A-Z]/.test(password)) {
        return {
            valid: false,
            error: 'Password must contain at least one uppercase letter',
        };
    }
    // Check lowercase
    if (!/[a-z]/.test(password)) {
        return {
            valid: false,
            error: 'Password must contain at least one lowercase letter',
        };
    }
    // Check number
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }
    return { valid: true };
};
exports.validatePasswordStrength = validatePasswordStrength;
//# sourceMappingURL=password.hash.js.map