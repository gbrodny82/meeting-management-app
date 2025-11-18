import { storage } from "./storage";
import { 
  checkMeetingAchievements, 
  checkActionAchievements, 
  checkProductivityAchievements 
} from "./achievements";
import type { Meeting, Action } from "@shared/schema";

/**
 * Achievement tracking service - automatically unlocks badges when users reach milestones
 */

export async function trackMeetingAchievements(userId: string, meeting: Meeting, actions: Action[] = []): Promise<string[]> {
  try {
    const stats = await storage.getStats(userId);
    const userAchievements = await storage.getUserAchievements(userId);
    const allAchievements = await storage.getAchievements();
    
    // Get currently unlocked achievement badge IDs
    const unlockedBadgeIds = new Set(
      userAchievements
        .map(ua => allAchievements.find(a => a.id === ua.achievementId)?.badgeId)
        .filter(Boolean)
    );

    const newlyEarnedBadges: string[] = [];

    // Check meeting-based achievements
    const meetingBadges = checkMeetingAchievements(userId, stats);
    for (const badgeId of meetingBadges) {
      if (!unlockedBadgeIds.has(badgeId)) {
        const achievement = allAchievements.find(a => a.badgeId === badgeId);
        if (achievement) {
          await storage.unlockAchievement(userId, achievement.id);
          newlyEarnedBadges.push(badgeId);
          console.log(`🎉 User ${userId} unlocked achievement: ${achievement.name}`);
        }
      }
    }

    // Check productivity achievements for this specific meeting
    const productivityBadges = checkProductivityAchievements(meeting, actions);
    for (const badgeId of productivityBadges) {
      if (!unlockedBadgeIds.has(badgeId)) {
        const achievement = allAchievements.find(a => a.badgeId === badgeId);
        if (achievement) {
          await storage.unlockAchievement(userId, achievement.id);
          newlyEarnedBadges.push(badgeId);
          console.log(`🎉 User ${userId} unlocked achievement: ${achievement.name}`);
        }
      }
    }

    // Check team-building achievements
    const employees = await storage.getEmployees(userId);
    const meetings = await storage.getMeetings(userId);
    const uniqueTeamMembers = new Set(meetings.map(m => m.employeeId)).size;
    
    if (uniqueTeamMembers >= 10 && !unlockedBadgeIds.has("team_builder")) {
      const achievement = allAchievements.find(a => a.badgeId === "team_builder");
      if (achievement) {
        await storage.unlockAchievement(userId, achievement.id);
        newlyEarnedBadges.push("team_builder");
        console.log(`🎉 User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error tracking meeting achievements:", error);
    return [];
  }
}

export async function trackActionAchievements(userId: string, action: Action): Promise<string[]> {
  try {
    const stats = await storage.getStats(userId);
    const userAchievements = await storage.getUserAchievements(userId);
    const allAchievements = await storage.getAchievements();
    
    // Get currently unlocked achievement badge IDs
    const unlockedBadgeIds = new Set(
      userAchievements
        .map(ua => allAchievements.find(a => a.id === ua.achievementId)?.badgeId)
        .filter(Boolean)
    );

    const newlyEarnedBadges: string[] = [];

    // Check action-based achievements
    const actionBadges = checkActionAchievements(userId, stats);
    for (const badgeId of actionBadges) {
      if (!unlockedBadgeIds.has(badgeId)) {
        const achievement = allAchievements.find(a => a.badgeId === badgeId);
        if (achievement) {
          await storage.unlockAchievement(userId, achievement.id);
          newlyEarnedBadges.push(badgeId);
          console.log(`🎉 User ${userId} unlocked achievement: ${achievement.name}`);
        }
      }
    }

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error tracking action achievements:", error);
    return [];
  }
}

export async function checkWeeklyCompletion(userId: string): Promise<string[]> {
  try {
    const userAchievements = await storage.getUserAchievements(userId);
    const allAchievements = await storage.getAchievements();
    
    // Get currently unlocked achievement badge IDs
    const unlockedBadgeIds = new Set(
      userAchievements
        .map(ua => allAchievements.find(a => a.id === ua.achievementId)?.badgeId)
        .filter(Boolean)
    );

    const newlyEarnedBadges: string[] = [];

    // Check if all actions for this week are completed
    const actions = await storage.getActions(userId);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekActions = actions.filter(action => {
      // Since Action type doesn't have createdAt, use current date for now
      // In production, you would add createdAt to the Action schema
      const actionDate = new Date();
      return actionDate >= startOfWeek;
    });
    
    const allCompleted = weekActions.length > 0 && 
      weekActions.every(action => action.status === "completed");
    
    if (allCompleted && !unlockedBadgeIds.has("week_warrior")) {
      const achievement = allAchievements.find(a => a.badgeId === "week_warrior");
      if (achievement) {
        await storage.unlockAchievement(userId, achievement.id);
        newlyEarnedBadges.push("week_warrior");
        console.log(`🎉 User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error checking weekly completion:", error);
    return [];
  }
}