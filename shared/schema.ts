import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from 'drizzle-orm';

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  relationship: text("relationship").notNull(),
  userId: varchar("user_id").notNull(), // Owner of this employee record
  linkedUserId: varchar("linked_user_id"), // System user linked to this team member
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  employeeName: text("employee_name").notNull(),
  title: text("title"),
  date: text("date").notNull(),
  notes: text("notes").notNull(),
  userId: varchar("user_id").notNull(),
  // Email settings for this meeting
  emailRecipient: varchar("email_recipient"), // Custom email for meeting notes
  emailSent: boolean("email_sent").default(false), // Track if email was sent
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  assignee: text("assignee").notNull(),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  meetingId: integer("meeting_id"),
  employeeName: text("employee_name").notNull(),
  userId: varchar("user_id").notNull(),
  assignedToUserId: varchar("assigned_to_user_id"), // For cross-user assignments
  // Note context fields for precise navigation to meeting text
  noteExcerpt: text("note_excerpt"), // Text snippet from meeting notes where action originated
  noteStart: integer("note_start"), // Start position in notes text
  noteEnd: integer("note_end"), // End position in notes text
  notesHash: varchar("notes_hash"), // Hash of notes to detect changes
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isApproved: boolean("is_approved").default(false),
  role: varchar("role").default("user"), // 'admin', 'user'
  telegramChatId: varchar("telegram_chat_id"),
  notificationsEnabled: boolean("notifications_enabled").default(false),
  // Email configuration for sending meeting notes
  emailSenderAddress: varchar("email_sender_address"), // Gmail address for sending
  emailSenderPassword: varchar("email_sender_password"), // App password for Gmail
  emailEnabled: boolean("email_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification schedules table for flexible scheduling
export const notificationSchedules = pgTable("notification_schedules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(), // e.g., "Morning Update", "End of Day"
  cronPattern: text("cron_pattern").notNull(), // e.g., "0 9 * * 1-5" for 9am weekdays
  isActive: boolean("is_active").default(true),
  notificationType: text("notification_type").notNull().default("daily"), // daily, weekly, urgent
  includeActions: boolean("include_actions").default(true),
  includeMeetings: boolean("include_meetings").default(true),
  includeStats: boolean("include_stats").default(true),
  customMessage: text("custom_message"), // Optional custom message
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievement badges system for gamification
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  badgeId: varchar("badge_id").notNull(), // unique identifier for badge type
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // icon name or emoji
  category: text("category").notNull(), // e.g., "meetings", "actions", "productivity"
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
  requirements: jsonb("requirements").notNull(), // criteria for earning
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements - tracks which badges users have earned
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: jsonb("progress"), // track progress toward achievement
  isViewed: boolean("is_viewed").default(false), // for showing "new" badges
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
});

export const updateActionSchema = createInsertSchema(actions).partial().omit({
  id: true,
});

export const insertNotificationScheduleSchema = createInsertSchema(notificationSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationScheduleSchema = createInsertSchema(notificationSchedules).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type UpdateAction = z.infer<typeof updateActionSchema>;

// Enums
export const ActionStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

export const ActionPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type ActionStatusType = typeof ActionStatus[keyof typeof ActionStatus];
export type ActionPriorityType = typeof ActionPriority[keyof typeof ActionPriority];

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Achievement Categories
export const AchievementCategory = {
  MEETINGS: "meetings",
  ACTIONS: "actions", 
  PRODUCTIVITY: "productivity",
  SOCIAL: "social",
  MILESTONES: "milestones",
} as const;

export const AchievementRarity = {
  COMMON: "common",
  RARE: "rare", 
  EPIC: "epic",
  LEGENDARY: "legendary",
} as const;

export type AchievementCategoryType = typeof AchievementCategory[keyof typeof AchievementCategory];
export type AchievementRarityType = typeof AchievementRarity[keyof typeof AchievementRarity];

export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type InsertNotificationSchedule = z.infer<typeof insertNotificationScheduleSchema>;
export type UpdateNotificationSchedule = z.infer<typeof updateNotificationScheduleSchema>;

// Notification schedule presets
export const SchedulePresets = {
  MORNING_WEEKDAYS: {
    name: "Morning Update (Weekdays)",
    cronPattern: "0 9 * * 1-5",
    description: "Daily at 9:00 AM, Monday through Friday"
  },
  END_OF_DAY: {
    name: "End of Day Summary",
    cronPattern: "0 17 * * 1-5", 
    description: "Daily at 5:00 PM, Monday through Friday"
  },
  MONDAY_PLANNING: {
    name: "Monday Planning",
    cronPattern: "0 8 * * 1",
    description: "Every Monday at 8:00 AM"
  },
  FRIDAY_REVIEW: {
    name: "Friday Review",
    cronPattern: "0 16 * * 5",
    description: "Every Friday at 4:00 PM"
  },
  CUSTOM: {
    name: "Custom Schedule",
    cronPattern: "",
    description: "Set your own cron pattern"
  }
} as const;
