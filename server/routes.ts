import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertMeetingSchema, insertActionSchema, updateActionSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendTestNotification, sendTestDailyNotification } from "./telegram";
import { 
  authRateLimit, 
  strictApiRateLimit, 
  sanitizeInput, 
  handleValidationErrors, 
  auditLogger,
  logSecurityEvent 
} from "./security-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth routes with enhanced security
  app.get('/api/auth/user', authRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      logSecurityEvent('AUTH_ERROR', { userId: req.user?.claims?.sub, error: (error as Error).message });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user.claims.sub;
      const employees = await storage.getEmployees(userId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertEmployeeSchema.parse({ ...req.body, userId });
      const employee = await storage.createEmployee(validated, userId);
      res.status(201).json(employee);
    } catch (error) {
      console.error('Employee creation error:', error);
      res.status(400).json({ message: "Invalid employee data", error: (error as Error).message });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, updates, userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetings = await storage.getMeetings(userId);
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertMeetingSchema.parse({ ...req.body, userId });
      const meeting = await storage.createMeeting(validated, userId);
      
      // Send email if recipient is provided and email is configured
      if (meeting.emailRecipient) {
        try {
          const { sendMeetingEmail } = await import("./email");
          await sendMeetingEmail(userId, {
            meetingId: meeting.id,
            title: meeting.title,
            employeeName: meeting.employeeName,
            date: meeting.date,
            notes: meeting.notes,
            recipientEmail: meeting.emailRecipient,
          });
          console.log(`Email sent automatically for meeting ${meeting.id} to ${meeting.emailRecipient}`);
        } catch (emailError) {
          console.error('Failed to send meeting email:', emailError);
          // Don't fail the meeting creation if email fails
        }
      }
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error('Meeting creation error:', error);
      res.status(400).json({ message: "Invalid meeting data", error: (error as Error).message });
    }
  });

  app.put("/api/meetings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = insertMeetingSchema.partial().parse(req.body);
      const meeting = await storage.updateMeeting(id, updates, userId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ message: "Invalid meeting data" });
    }
  });

  app.delete("/api/meetings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeeting(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // Action routes
  app.get("/api/actions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const actions = await storage.getActions(userId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch actions" });
    }
  });

  app.post("/api/actions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertActionSchema.parse({ ...req.body, userId });
      const action = await storage.createAction(validated, userId);
      res.status(201).json(action);
    } catch (error) {
      console.error('Action creation error:', error);
      res.status(400).json({ message: "Invalid action data", error: (error as Error).message });
    }
  });

  app.put("/api/actions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = updateActionSchema.parse(req.body);
      const action = await storage.updateAction(id, updates, userId);
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error('Update action error:', error);
      
      // Check if it's a database connection error
      if ((error as any).message?.includes('terminating connection due to administrator command') ||
          (error as any).code === '57P01') {
        return res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      }
      
      res.status(400).json({ message: "Invalid action data", error: (error as Error).message });
    }
  });

  app.delete("/api/actions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAction(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Action not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete action" });
    }
  });

  // Stats route
  app.get("/api/stats", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Insights routes
  app.post("/api/insights/meeting/:id", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user.claims.sub;
      const meetingId = parseInt(req.params.id);
      
      const meetings = await storage.getMeetings(userId);
      const meeting = meetings.find(m => m.id === meetingId);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const actions = await storage.getActions(userId);
      const meetingActions = actions.filter(a => a.meetingId === meetingId);
      
      const { generateMeetingInsights } = await import('./insights');
      const insights = await generateMeetingInsights(meeting, meetingActions);
      
      res.json(insights);
    } catch (error) {
      console.error('Insights generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate insights", 
        error: (error as Error).message 
      });
    }
  });

  app.get("/api/insights/team", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user.claims.sub;
      const meetings = await storage.getMeetings(userId);
      
      // Get recent meetings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMeetings = meetings.filter(meeting => 
        new Date(meeting.date) >= thirtyDaysAgo
      ).slice(0, 10); // Limit to 10 most recent
      
      const { generateBulkInsights } = await import('./insights');
      const insights = await generateBulkInsights(recentMeetings);
      
      res.json({ insights, meetingCount: recentMeetings.length });
    } catch (error) {
      console.error('Team insights generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate team insights", 
        error: (error as Error).message 
      });
    }
  });

  // Employee linking route (admin only)
  app.post("/api/admin/employees/:id/link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employeeId = parseInt(req.params.id);
      const { linkedUserId } = req.body;
      
      if (!linkedUserId) {
        return res.status(400).json({ message: "linkedUserId is required" });
      }
      
      const employee = await storage.linkEmployeeToUser(employeeId, linkedUserId, userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found or access denied" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error('Employee linking error:', error);
      res.status(500).json({ message: "Failed to link employee to user" });
    }
  });

  // Admin routes for user management with enhanced security
  app.get("/api/admin/users", strictApiRateLimit, isAuthenticated, auditLogger('VIEW_ALL_USERS'), async (req: any, res: any) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', { 
          userId: req.user.claims.sub, 
          userRole: currentUser?.role,
          attemptedAction: 'VIEW_ALL_USERS'
        });
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/approve", strictApiRateLimit, isAuthenticated, auditLogger('APPROVE_USER'), sanitizeInput, handleValidationErrors, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', { 
          userId: req.user.claims.sub, 
          attemptedAction: 'APPROVE_USER',
          targetUserId: req.params.id
        });
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;
      const user = await storage.approveUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logSecurityEvent('USER_APPROVED', { 
        adminUserId: req.user.claims.sub, 
        approvedUserId: userId 
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/admin/users/:id/role", strictApiRateLimit, isAuthenticated, auditLogger('UPDATE_USER_ROLE'), sanitizeInput, handleValidationErrors, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', { 
          userId: req.user.claims.sub, 
          attemptedAction: 'UPDATE_USER_ROLE',
          targetUserId: req.params.id
        });
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(userId, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logSecurityEvent('USER_ROLE_UPDATED', { 
        adminUserId: req.user.claims.sub, 
        targetUserId: userId,
        newRole: role,
        previousRole: currentUser.role
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Notification routes
  app.post("/api/notifications/telegram", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId, enabled } = req.body;
      
      if (!chatId || typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "Chat ID and enabled status are required" });
      }
      
      const user = await storage.updateUserTelegramSettings(userId, chatId, enabled);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  app.post("/api/notifications/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.telegramChatId) {
        return res.status(400).json({ message: "Telegram chat ID not configured" });
      }
      
      await sendTestNotification(user.telegramChatId);
      res.json({ message: "Test notification sent successfully" });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  app.post("/api/notifications/test-daily", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.telegramChatId) {
        return res.status(400).json({ message: "Telegram chat ID not configured" });
      }
      
      await sendTestDailyNotification(user.telegramChatId, userId);
      res.json({ message: "Test daily notification sent successfully" });
    } catch (error) {
      console.error("Error sending test daily notification:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send test daily notification";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Notification schedule routes
  app.get("/api/notification-schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schedules = await storage.getNotificationSchedules(userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification schedules" });
    }
  });

  app.post("/api/notification-schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = req.body; // Simple validation for now
      const schedule = await storage.createNotificationSchedule(validated, userId);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.put("/api/notification-schedules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = req.body;
      const schedule = await storage.updateNotificationSchedule(id, updates, userId);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.delete("/api/notification-schedules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNotificationSchedule(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Bot status endpoint for debugging
  app.get("/api/notifications/bot-status", isAuthenticated, async (req: any, res) => {
    try {
      const { getBotStatus } = await import("./telegram");
      const status = getBotStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  // Email configuration endpoints
  app.post("/api/email/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { senderEmail, senderPassword, enabled } = req.body;
      
      if (!senderEmail || !senderPassword) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.updateUserEmailSettings(userId, senderEmail, senderPassword, enabled);
      res.json(user);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post("/api/email/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { testRecipient } = req.body;
      
      if (!testRecipient) {
        return res.status(400).json({ message: "Test recipient email required" });
      }
      
      const { testEmailConfiguration } = await import("./email");
      await testEmailConfiguration(userId, testRecipient);
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send test email";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post("/api/meetings/:id/send-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingId = parseInt(req.params.id);
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      
      const meeting = await storage.getMeeting(meetingId, userId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      const { sendMeetingEmail } = await import("./email");
      await sendMeetingEmail(userId, {
        meetingId: meeting.id,
        title: meeting.title,
        employeeName: meeting.employeeName,
        date: meeting.date,
        notes: meeting.notes,
        recipientEmail,
      });
      
      res.json({ message: "Meeting email sent successfully" });
    } catch (error) {
      console.error("Error sending meeting email:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send meeting email";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req: any, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAchievements = await storage.getUserAchievements(userId);
      const allAchievements = await storage.getAchievements();
      
      // Combine achievement details with user progress
      const achievementsWithStatus = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
        return {
          ...achievement,
          unlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt || null,
          isViewed: userAchievement?.isViewed ?? true,
          userAchievementId: userAchievement?.id || null,
        };
      });

      res.json(achievementsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/:userAchievementId/viewed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAchievementId = parseInt(req.params.userAchievementId);
      const success = await storage.markAchievementViewed(userAchievementId, userId);
      if (success) {
        res.json({ message: "Achievement marked as viewed" });
      } else {
        res.status(404).json({ message: "Achievement not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to mark achievement as viewed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
