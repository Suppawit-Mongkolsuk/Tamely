// ===== Environment Config =====
// อ่านค่า env vars แบบ type-safe

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:8080',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
