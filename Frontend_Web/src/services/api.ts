// ===== API Client =====
// ตั้งค่า base HTTP client สำหรับเรียก Backend API

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // สร้าง URL พร้อม query params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] =
        `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
        credentials: 'include', // ← ส่ง cookie ทุก request
      });
    } catch {
      // Network error — backend ไม่ได้รัน หรือ CORS block
      throw new ApiError(
        0,
        'ไม่สามารถเชื่อมต่อ server ได้ — กรุณาลองใหม่อีกครั้ง',
      );
    }

    if (!response.ok) {
      let errorMessage = 'เกิดข้อผิดพลาด';
      try {
        const errorBody = await response.json();
        // backend ส่ง { success: false, error: "..." }
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch {
        // response ไม่ใช่ JSON
      }
      throw new ApiError(response.status, errorMessage);
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
