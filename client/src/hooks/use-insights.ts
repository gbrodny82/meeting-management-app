import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface MeetingInsights {
  keyPoints: string[];
  actionRecommendations: string[];
  followUpSuggestions: string[];
  sentimentAnalysis: {
    tone: 'positive' | 'neutral' | 'negative';
    confidence: number;
    summary: string;
  };
  effectiveness: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  nextSteps: string[];
}

export interface TeamInsights {
  insights: string;
  meetingCount: number;
}

export function useMeetingInsights(meetingId: number, enabled: boolean = true) {
  return useQuery<MeetingInsights>({
    queryKey: ['/api/insights/meeting', meetingId],
    queryFn: async () => {
      const response = await apiRequest('POST', `/api/insights/meeting/${meetingId}`, {});
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useTeamInsights(enabled: boolean = true) {
  return useQuery<TeamInsights>({
    queryKey: ['/api/insights/team'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/insights/team', {});
      return response.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}