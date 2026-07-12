'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expenseService,
  type CreateExpensePayload,
  type ExpenseQueryParams,
  type UpdateExpensePayload,
} from '@/services/fuel-expense.service';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params?: ExpenseQueryParams) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  statistics: (dateFrom?: string, dateTo?: string) =>
    [...expenseKeys.all, 'statistics', dateFrom, dateTo] as const,
};

export function useExpenseList(params?: ExpenseQueryParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expenseService.list(params),
  });
}

export function useExpenseDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useExpenseStatistics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: expenseKeys.statistics(dateFrom, dateTo),
    queryFn: () => expenseService.getStatistics(dateFrom, dateTo),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      expenseService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
