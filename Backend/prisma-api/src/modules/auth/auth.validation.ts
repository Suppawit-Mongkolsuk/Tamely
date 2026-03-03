// เช็ค อีเมล ว่าถูกต้องไหม (TLD ต้องมีอย่างน้อย 2 ตัวอักษร)
const isValidEmail = (email: string): boolean => {
  const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailregex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// ตรวจสอบ resister input
export const validateRegisterInput = (
  email: string,
  password: string,
  Name: string,
): { valid: boolean; message?: string } => {
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

// ตรวจสอบ login input
export const validateLoginInput = (data: {
  email: string;
  password: string;
}): { valid: boolean; message?: string } => {
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
