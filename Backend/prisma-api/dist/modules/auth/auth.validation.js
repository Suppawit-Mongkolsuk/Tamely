"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginInput = exports.validateRegisterInput = void 0;
// เช็ค อีเมล ว่าถูกต้องไหม
const isValidEmail = (email) => {
    const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailregex.test(email);
};
const isValidPassword = (password) => {
    return password.length >= 8;
};
// ตรวจสอบ resister input
const validateRegisterInput = (email, password, Name) => {
    if (!email) {
        return { valid: false, message: 'Email is required.' };
    }
    if (!isValidEmail(email)) {
        return { valid: false, message: 'Invalid email format.' };
    }
    if (!password) {
        return { valid: false, message: 'Password is required.' };
    }
    if (!isValidPassword(password)) {
        return { valid: false, message: 'Password must be at least 8 characters.' };
    }
    if (!Name) {
        return { valid: false, message: 'Name is required.' };
    }
    if (Name.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters.' };
    }
    return { valid: true };
};
exports.validateRegisterInput = validateRegisterInput;
// ตรวจสอบ login input
const validateLoginInput = (data) => {
    const { email, password } = data;
    if (!email) {
        return { valid: false, message: 'Email is required.' };
    }
    if (!isValidEmail(email)) {
        return { valid: false, message: 'Invalid email format.' };
    }
    if (!password) {
        return { valid: false, message: 'Password is required.' };
    }
    if (!isValidPassword(password)) {
        return { valid: false, message: 'Password must be at least 8 characters.' };
    }
    return { valid: true };
};
exports.validateLoginInput = validateLoginInput;
//# sourceMappingURL=auth.validation.js.map