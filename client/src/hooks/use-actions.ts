import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Action, InsertAction, UpdateAction } from '@shared/schema';

export function useActions() {
  return useQuery<Action[]>({
    queryKey: ['/api/actions'],
  });
}

export function useStats() {
  return useQuery<{
    totalEmployees: number;
    totalMeetings: number;
    totalActions: number;
    activeActions: number;
    completedActions: number;
    overdueActions: number;
  }>({
    queryKey: ['/api/stats'],
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: InsertAction) => {
      const response = await apiRequest('POST', '/api/actions', action);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateAction }) => {
      const response = await apiRequest('PUT', `/api/actions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/actions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });
}
