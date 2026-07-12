export interface ApiResponse<T = unknown, M = Record<string, unknown>> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
