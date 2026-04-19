import { z } from "zod";

/* ======================= TYPES ======================= */

export type TypePayloadRegister = {
  email: string;
  password: string;
  displayName: string;
};

export type TypePayloadLogin = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type TypePayloadUpdateProfile = {
  displayName?: string;
  bio?: string;
};

export type UpdateProfileData = {
  displayName?: string;
  bio?: string;
};

/* ======================= HELPERS ======================= */

const zodEmail = z
  .string({ message: "กรุณากรอกอีเมล" }) 
  .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" })
  .transform((v) => v.trim().toLowerCase()); // trim และ lowercase อีเมลเพื่อความสม่ำเสมอ

const zodPassword = z
  .string({ message: "กรุณากรอกรหัสผ่าน" })
  .min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }); // กำหนดความยาวขั้นต่ำของรหัสผ่านเป็น 8 ตัวอักษร

/* ======================= REGISTER ======================= */

export const RegisterSchema = z.object({
  body: z.object({
    email: zodEmail,
    password: zodPassword,
    displayName: z
      .string({ message: "กรุณากรอกชื่อ" })
      .min(2, { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" })
      .max(100, { message: "ชื่อต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim()),
  }),
});

/* ======================= LOGIN ======================= */

export const LoginSchema = z.object({
  body: z.object({
    email: zodEmail,
    password: zodPassword,
    rememberMe: z.boolean().optional().default(false),
  }),
});

/* ======================= FORGOT PASSWORD ======================= */

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: zodEmail,
  }),
});

/* ======================= RESET PASSWORD ======================= */

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({ message: "กรุณากรอก Reset Token" })
      .min(1, { message: "Reset Token ต้องมีค่า" }),
    newPassword: zodPassword,
  }),
});

/* ======================= UPDATE PROFILE ======================= */

export const UpdateProfileSchema = z.object({
  body: z.object({
    displayName: z
      .string()
      .min(2, { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" })
      .max(100, { message: "ชื่อต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    bio: z
      .string()
      .max(500, { message: "Bio ต้องไม่เกิน 500 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
  }),
});


