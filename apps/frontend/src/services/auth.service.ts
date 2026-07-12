import type { ApiResponse, AuthTokens } from '@transitops/shared-types';
import { apiClient } from './api';

export const authService = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', {
      email,
      password,
    });
    return data.data;
  },
};
