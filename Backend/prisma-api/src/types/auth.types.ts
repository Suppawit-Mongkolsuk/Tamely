export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  sessionType: 'user' | 'admin';
  user?: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  admin?: {
    username: string;
  };
}
// JWT Payload ที่เราจะใช้ในการสร้างและตรวจสอบ token
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AdminJwtPayload {
  username: string;
  purpose: 'admin';
  iat?: number;
  exp?: number;
}
