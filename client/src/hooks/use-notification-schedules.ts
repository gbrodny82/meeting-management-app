import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface NotificationSchedule {
  id: number;
  name: string;
  cronPattern: string;
  isActive: boolean;
  notificationType: string;
  includeActions: boolean;
  includeMeetings: boolean;
  includeStats: boolean;
  customMessage?: string;
}

export function useNotificationSchedules() {
  return useQuery<NotificationSchedule[]>({
    queryKey: ['/api/notification-schedules'],
  });
}

export function useCreateNotificationSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedule: Omit<NotificationSchedule, 'id'>) => {
      const response = await apiRequest('POST', '/api/notification-schedules', schedule);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-schedules'] });
    },
  });
}

export function useUpdateNotificationSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<NotificationSchedule> }) => {
      const response = await apiRequest('PUT', `/api/notification-schedules/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-schedules'] });
    },
  });
}

export function useDeleteNotificationSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/notification-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-schedules'] });
    },
  });
}