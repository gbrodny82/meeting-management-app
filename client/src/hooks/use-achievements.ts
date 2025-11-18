import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Achievement, UserAchievement } from "@shared/schema";

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: Date | null;
  isViewed: boolean;
  userAchievementId: number | null;
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    refetchOnWindowFocus: false,
  });
}

export function useUserAchievements() {
  return useQuery<AchievementWithStatus[]>({
    queryKey: ["/api/achievements/user"],
    refetchOnWindowFocus: false,
  });
}

export function useMarkAchievementViewed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userAchievementId: number) => {
      return await fetch(`/api/achievements/${userAchievementId}/viewed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/user"] });
    },
  });
}

// Helper functions for achievement logic
export function getNewAchievementsCount(achievements: AchievementWithStatus[]): number {
  return achievements.filter(a => a.unlocked && !a.isViewed).length;
}

export function getUnlockedAchievements(achievements: AchievementWithStatus[]): AchievementWithStatus[] {
  return achievements.filter(a => a.unlocked);
}

export function getAchievementsByCategory(achievements: AchievementWithStatus[], category: string): AchievementWithStatus[] {
  return achievements.filter(a => a.category === category);
}

export function getAchievementProgress(achievements: AchievementWithStatus[]): {
  total: number;
  unlocked: number;
  percentage: number;
} {
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  const percentage = total > 0 ? (unlocked / total) * 100 : 0;
  
  return { total, unlocked, percentage };
}