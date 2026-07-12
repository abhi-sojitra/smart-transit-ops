import { apiClient, authHttp } from '@/services/api';
import type { ApiResponse, AuthTokens } from '@transitops/shared-types';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', {
      email,
      password,
    });
    return unwrap(data);
  },

  /** Uses bare client so refresh never triggers the 401 interceptor. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await authHttp.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    return unwrap(data);
  },

  async logout(): Promise<{ loggedOut: boolean }> {
    const { data } = await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/auth/logout');
    return unwrap(data);
  },
};
