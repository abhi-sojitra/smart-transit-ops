import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

/** Stub health query — demonstrates TanStack Query wiring */
export function useHealthQuery(enabled = false) {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/health');
      return data;
    },
    enabled,
  });
}
