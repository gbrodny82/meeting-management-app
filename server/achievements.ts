import { Achievement, UserAchievement, AchievementCategory, AchievementRarity } from "@shared/schema";

// Achievement definitions - these define all available badges
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'createdAt'>[] = [
  // Meeting-related achievements
  {
    badgeId: "first_meeting",
    name: "First Steps",
    description: "Created your first meeting",
    icon: "🎯",
    category: AchievementCategory.MEETINGS,
    rarity: AchievementRarity.COMMON,
    requirements: { meetingsCreated: 1 },
    isActive: true,
  },
  {
    badgeId: "meeting_streak_5",
    name: "Consistent Connector",
    description: "Created 5 meetings in a row",
    icon: "🔥",
    category: AchievementCategory.MEETINGS,
    rarity: AchievementRarity.COMMON,
    requirements: { meetingsCreated: 5 },
    isActive: true,
  },
  {
    badgeId: "meeting_master",
    name: "Meeting Master",
    description: "Created 25 meetings",
    icon: "👑",
    category: AchievementCategory.MEETINGS,
    rarity: AchievementRarity.RARE,
    requirements: { meetingsCreated: 25 },
    isActive: true,
  },
  {
    badgeId: "meeting_legend",
    name: "Meeting Legend",
    description: "Created 100 meetings",
    icon: "🏆",
    category: AchievementCategory.MEETINGS,
    rarity: AchievementRarity.LEGENDARY,
    requirements: { meetingsCreated: 100 },
    isActive: true,
  },

  // Action-related achievements
  {
    badgeId: "first_action",
    name: "Action Hero",
    description: "Created your first action item",
    icon: "⚡",
    category: AchievementCategory.ACTIONS,
    rarity: AchievementRarity.COMMON,
    requirements: { actionsCreated: 1 },
    isActive: true,
  },
  {
    badgeId: "task_completer",
    name: "Task Completer",
    description: "Completed 10 action items",
    icon: "✅",
    category: AchievementCategory.ACTIONS,
    rarity: AchievementRarity.COMMON,
    requirements: { actionsCompleted: 10 },
    isActive: true,
  },
  {
    badgeId: "productivity_pro",
    name: "Productivity Pro",
    description: "Completed 50 action items",
    icon: "🚀",
    category: AchievementCategory.ACTIONS,
    rarity: AchievementRarity.RARE,
    requirements: { actionsCompleted: 50 },
    isActive: true,
  },
  {
    badgeId: "action_champion",
    name: "Action Champion",
    description: "Completed 200 action items",
    icon: "🏅",
    category: AchievementCategory.ACTIONS,
    rarity: AchievementRarity.LEGENDARY,
    requirements: { actionsCompleted: 200 },
    isActive: true,
  },

  // Productivity achievements
  {
    badgeId: "early_bird",
    name: "Early Bird",
    description: "Created a meeting before 9 AM",
    icon: "🌅",
    category: AchievementCategory.PRODUCTIVITY,
    rarity: AchievementRarity.COMMON,
    requirements: { earlyMeeting: true },
    isActive: true,
  },
  {
    badgeId: "detailed_notes",
    name: "Detail Oriented",
    description: "Created a meeting with over 500 characters in notes",
    icon: "📝",
    category: AchievementCategory.PRODUCTIVITY,
    rarity: AchievementRarity.COMMON,
    requirements: { longNotes: true },
    isActive: true,
  },
  {
    badgeId: "action_packed",
    name: "Action Packed",
    description: "Created a meeting with 5+ action items",
    icon: "⚡",
    category: AchievementCategory.PRODUCTIVITY,
    rarity: AchievementRarity.RARE,
    requirements: { meetingWithManyActions: 5 },
    isActive: true,
  },
  {
    badgeId: "team_builder",
    name: "Team Builder",
    description: "Had meetings with 10+ different team members",
    icon: "👥",
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.RARE,
    requirements: { uniqueTeamMembers: 10 },
    isActive: true,
  },

  // Milestone achievements
  {
    badgeId: "week_warrior",
    name: "Week Warrior",
    description: "Completed all actions for a week",
    icon: "🗓️",
    category: AchievementCategory.MILESTONES,
    rarity: AchievementRarity.EPIC,
    requirements: { weeklyCompletion: true },
    isActive: true,
  },
  {
    badgeId: "perfectionist",
    name: "Perfectionist",
    description: "Maintain 100% action completion rate for 30 days",
    icon: "💎",
    category: AchievementCategory.MILESTONES,
    rarity: AchievementRarity.LEGENDARY,
    requirements: { perfectCompletionStreak: 30 },
    isActive: true,
  },
];

// Helper functions to check achievement progress
export function checkMeetingAchievements(userId: string, stats: any): string[] {
  const earnedBadges: string[] = [];
  
  if (stats.totalMeetings >= 1) earnedBadges.push("first_meeting");
  if (stats.totalMeetings >= 5) earnedBadges.push("meeting_streak_5");
  if (stats.totalMeetings >= 25) earnedBadges.push("meeting_master");
  if (stats.totalMeetings >= 100) earnedBadges.push("meeting_legend");

  return earnedBadges;
}

export function checkActionAchievements(userId: string, stats: any): string[] {
  const earnedBadges: string[] = [];
  
  if (stats.totalActions >= 1) earnedBadges.push("first_action");
  if (stats.completedActions >= 10) earnedBadges.push("task_completer");
  if (stats.completedActions >= 50) earnedBadges.push("productivity_pro");
  if (stats.completedActions >= 200) earnedBadges.push("action_champion");

  return earnedBadges;
}

export function checkProductivityAchievements(meeting: any, actions: any[]): string[] {
  const earnedBadges: string[] = [];
  
  // Check if meeting was created early (before 9 AM)
  const meetingHour = new Date(meeting.date).getHours();
  if (meetingHour < 9) earnedBadges.push("early_bird");
  
  // Check for detailed notes (over 500 characters)
  if (meeting.notes && meeting.notes.length > 500) {
    earnedBadges.push("detailed_notes");
  }
  
  // Check for action-packed meetings (5+ actions)
  if (actions.length >= 5) {
    earnedBadges.push("action_packed");
  }

  return earnedBadges;
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getRarityBorder(rarity: string): string {
  switch (rarity) {
    case 'common': return 'border-gray-300';
    case 'rare': return 'border-blue-300';
    case 'epic': return 'border-purple-300';
    case 'legendary': return 'border-yellow-300 shadow-lg';
    default: return 'border-gray-300';
  }
}