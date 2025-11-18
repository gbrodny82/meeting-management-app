import { 
  employees, 
  meetings, 
  actions,
  users,
  notificationSchedules,
  achievements,
  userAchievements,
  type Employee, 
  type InsertEmployee, 
  type Meeting, 
  type InsertMeeting, 
  type Action, 
  type InsertAction,
  type UpdateAction,
  type User,
  type UpsertUser,
  type NotificationSchedule,
  type InsertNotificationSchedule,
  type UpdateNotificationSchedule,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  ActionStatus 
} from "@shared/schema";
import { db } from "./db";
import { eq, count, and, or } from "drizzle-orm";
import { 
  encryptSensitiveFields, 
  decryptSensitiveFields, 
  encryptText,
  SENSITIVE_FIELDS 
} from "./encryption";

export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin operations for access control
  getAllUsers(): Promise<User[]>;
  approveUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Notification operations
  updateUserTelegramSettings(userId: string, chatId: string, enabled: boolean): Promise<User>;
  updateUserEmailSettings(userId: string, senderEmail: string, senderPassword: string, enabled: boolean): Promise<User>;
  getUsersWithNotifications(): Promise<User[]>;
  disableNotificationsForChatId(chatId: string): Promise<void>;
  
  // Notification schedules
  getNotificationSchedules(userId: string): Promise<NotificationSchedule[]>;
  createNotificationSchedule(schedule: InsertNotificationSchedule, userId: string): Promise<NotificationSchedule>;
  updateNotificationSchedule(id: number, updates: UpdateNotificationSchedule, userId: string): Promise<NotificationSchedule | undefined>;
  deleteNotificationSchedule(id: number, userId: string): Promise<boolean>;

  // Employees (user-scoped)
  getEmployees(userId: string): Promise<Employee[]>;
  getEmployee(id: number, userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee, userId: string): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<InsertEmployee>, userId: string): Promise<Employee | undefined>;
  deleteEmployee(id: number, userId: string): Promise<boolean>;
  linkEmployeeToUser(employeeId: number, linkedUserId: string | null, managerId: string): Promise<Employee | undefined>;

  // Meetings (user-scoped)
  getMeetings(userId: string): Promise<Meeting[]>;
  getMeeting(id: number, userId: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting, userId: string): Promise<Meeting>;
  updateMeeting(id: number, updates: Partial<InsertMeeting>, userId: string): Promise<Meeting | undefined>;
  deleteMeeting(id: number, userId: string): Promise<boolean>;
  updateMeetingEmailStatus(meetingId: number, emailSent: boolean): Promise<void>;

  // Actions (user-scoped + cross-user assignments)
  getActions(userId: string): Promise<Action[]>;
  getAction(id: number, userId: string): Promise<Action | undefined>;
  createAction(action: InsertAction, userId: string): Promise<Action>;
  updateAction(id: number, updates: UpdateAction, userId: string): Promise<Action | undefined>;
  deleteAction(id: number, userId: string): Promise<boolean>;
  getActionsByMeeting(meetingId: number, userId: string): Promise<Action[]>;
  getActionsByStatus(status: string, userId: string): Promise<Action[]>;
  getAssignedActions(userId: string): Promise<Action[]>; // Actions assigned TO this user

  // Stats (user-scoped)
  getStats(userId: string): Promise<{
    totalEmployees: number;
    totalMeetings: number;
    totalActions: number;
    activeActions: number;
    completedActions: number;
    overdueActions: number;
  }>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement>;
  markAchievementViewed(userAchievementId: number, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private meetings: Map<number, Meeting>;
  private actions: Map<number, Action>;
  private users: Map<string, User>;
  private currentId: number;

  constructor() {
    this.employees = new Map();
    this.meetings = new Map();
    this.actions = new Map();
    this.users = new Map();
    this.currentId = 1;
    this.initSampleData();
  }

  private initSampleData() {
    // Sample employees
    const emp1: Employee = {
      id: this.currentId++,
      name: "Sarah Johnson",
      role: "Senior Developer",
      department: "Engineering",
      relationship: "Direct Report"
    };
    const emp2: Employee = {
      id: this.currentId++,
      name: "Mike Chen",
      role: "Product Manager",
      department: "Product",
      relationship: "Peer"
    };
    this.employees.set(emp1.id, emp1);
    this.employees.set(emp2.id, emp2);

    // Sample meetings
    const meeting1: Meeting = {
      id: this.currentId++,
      employeeId: emp1.id,
      employeeName: emp1.name,
      title: "Q1 Planning Meeting",
      date: "2024-01-15",
      notes: `# Q1 Planning Meeting
Discussed upcoming quarter goals and resource allocation.

## Key Discussion Points
- **Budget approval** for new development tools
- Timeline confirmed for customer feature requests
- **Performance review** preparation needed

## Action Items
- Submit training budget by end of week
- Schedule architecture review meeting`
    };

    const meeting2: Meeting = {
      id: this.currentId++,
      employeeId: emp2.id,
      employeeName: emp2.name,
      title: "Performance Review Meeting",
      date: "2024-01-16",
      notes: `# Performance Review Meeting
Discussed Mike's progress and future opportunities.

## Achievements
- **Successfully launched** three major features
- Improved team collaboration

## Goals for Next Quarter
- Lead the mobile app initiative
- Complete project management certification`
    };

    this.meetings.set(meeting1.id, meeting1);
    this.meetings.set(meeting2.id, meeting2);

    // Sample actions
    const actions: Action[] = [
      {
        id: this.currentId++,
        text: "Submit training budget proposal",
        assignee: "me",
        status: ActionStatus.PENDING,
        priority: "high",
        meetingId: meeting1.id,
        employeeName: emp1.name
      },
      {
        id: this.currentId++,
        text: "Schedule architecture review meeting",
        assignee: emp1.name,
        status: ActionStatus.IN_PROGRESS,
        priority: "medium",
        meetingId: meeting1.id,
        employeeName: emp1.name
      },
      {
        id: this.currentId++,
        text: "Complete project management certification",
        assignee: emp2.name,
        status: ActionStatus.IN_PROGRESS,
        priority: "medium",
        meetingId: meeting2.id,
        employeeName: emp2.name
      },
      {
        id: this.currentId++,
        text: "Update project documentation",
        assignee: "me",
        status: ActionStatus.COMPLETED,
        priority: "low",
        meetingId: meeting1.id,
        employeeName: emp1.name
      }
    ];

    actions.forEach(action => this.actions.set(action.id, action));
  }

  // User methods (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isApproved: existingUser?.isApproved || false,
      role: existingUser?.role || 'user',
      telegramChatId: existingUser?.telegramChatId || null,
      notificationsEnabled: existingUser?.notificationsEnabled || false,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Admin operations for access control
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async approveUser(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isApproved: true, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, role, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Notification operations
  async updateUserTelegramSettings(userId: string, chatId: string, enabled: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { 
      ...user, 
      telegramChatId: chatId, 
      notificationsEnabled: enabled, 
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserEmailSettings(userId: string, senderEmail: string, senderPassword: string, enabled: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    // Import encryption functions
    const { encryptText } = await import('./encryption');
    
    const updatedUser = { 
      ...user, 
      emailSenderAddress: senderEmail,
      emailSenderPassword: encryptText(senderPassword), // Encrypt the password before storing
      emailEnabled: enabled,
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUsersWithNotifications(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.notificationsEnabled && user.isApproved
    );
  }

  async disableNotificationsForChatId(chatId: string): Promise<void> {
    for (const user of Array.from(this.users.values())) {
      if (user.telegramChatId === chatId) {
        this.users.set(user.id, { 
          ...user, 
          notificationsEnabled: false, 
          updatedAt: new Date() 
        });
        break;
      }
    }
  }

  // Notification schedules (stubbed for MemStorage)
  async getNotificationSchedules(userId: string): Promise<NotificationSchedule[]> {
    return []; // MemStorage doesn't support notification schedules
  }

  async createNotificationSchedule(schedule: InsertNotificationSchedule, userId: string): Promise<NotificationSchedule> {
    throw new Error('MemStorage does not support notification schedules');
  }

  async updateNotificationSchedule(id: number, updates: UpdateNotificationSchedule, userId: string): Promise<NotificationSchedule | undefined> {
    throw new Error('MemStorage does not support notification schedules');
  }

  async deleteNotificationSchedule(id: number, userId: string): Promise<boolean> {
    throw new Error('MemStorage does not support notification schedules');
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const newEmployee: Employee = { id: this.currentId++, ...employee };
    this.employees.set(newEmployee.id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updated = { ...employee, ...updates };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  async linkEmployeeToUser(employeeId: number, linkedUserId: string | null, managerId: string): Promise<Employee | undefined> {
    const employee = this.employees.get(employeeId);
    if (!employee) return undefined;
    
    const updated = { ...employee, linkedUserId };
    this.employees.set(employeeId, updated);
    return updated;
  }

  // Meeting methods
  async getMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values());
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const newMeeting: Meeting = { 
      id: this.currentId++, 
      ...meeting,
      title: meeting.title || null
    };
    this.meetings.set(newMeeting.id, newMeeting);
    return newMeeting;
  }

  async updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const updated = { ...meeting, ...updates };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    return this.meetings.delete(id);
  }

  async updateMeetingEmailStatus(meetingId: number, emailSent: boolean): Promise<void> {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      const updated = { ...meeting, emailSent };
      this.meetings.set(meetingId, updated);
    }
  }

  // Action methods
  async getActions(): Promise<Action[]> {
    return Array.from(this.actions.values());
  }

  async getAction(id: number): Promise<Action | undefined> {
    return this.actions.get(id);
  }

  async createAction(action: InsertAction, userId: string): Promise<Action> {
    // Look up if the assignee is a linked employee
    let assignedToUserId: string | null = null;
    if (action.assignee) {
      const linkedEmployee = Array.from(this.employees.values()).find(emp => 
        emp.name === action.assignee && emp.userId === userId
      );
      
      if (linkedEmployee?.linkedUserId) {
        assignedToUserId = linkedEmployee.linkedUserId;
      }
    }

    const newAction: Action = { 
      id: this.currentId++, 
      ...action,
      status: action.status || "pending",
      priority: action.priority || "medium",
      meetingId: action.meetingId || null,
      userId,
      assignedToUserId
    };
    this.actions.set(newAction.id, newAction);
    return newAction;
  }

  async updateAction(id: number, updates: UpdateAction): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    const updated = { ...action, ...updates };
    this.actions.set(id, updated);
    return updated;
  }

  async deleteAction(id: number): Promise<boolean> {
    return this.actions.delete(id);
  }

  async getActionsByMeeting(meetingId: number): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.meetingId === meetingId);
  }

  async getActionsByStatus(status: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.status === status);
  }

  async getAssignedActions(userId: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.assignedToUserId === userId);
  }

  async getStats(): Promise<{
    totalEmployees: number;
    totalMeetings: number;
    totalActions: number;
    activeActions: number;
    completedActions: number;
    overdueActions: number;
  }> {
    const allActions = Array.from(this.actions.values());
    return {
      totalEmployees: this.employees.size,
      totalMeetings: this.meetings.size,
      totalActions: allActions.length,
      activeActions: allActions.filter(a => a.status !== ActionStatus.COMPLETED).length,
      completedActions: allActions.filter(a => a.status === ActionStatus.COMPLETED).length,
      overdueActions: allActions.filter(a => a.priority === "high" && a.status !== ActionStatus.COMPLETED).length,
    };
  }

  // Achievement methods (simplified for memory storage)
  async getAchievements(): Promise<Achievement[]> {
    // Return empty array for memory storage - achievements would be initialized in real app
    return [];
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // Return empty array for memory storage
    return [];
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement> {
    // Mock achievement for memory storage
    return {
      id: Date.now(),
      userId,
      achievementId,
      unlockedAt: new Date(),
      progress: null,
      isViewed: false,
    };
  }

  async markAchievementViewed(userAchievementId: number, userId: string): Promise<boolean> {
    return true;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const encryptedUserData = encryptSensitiveFields({
      ...userData,
      isApproved: false, // New users need approval by default
      role: 'user',
    }, SENSITIVE_FIELDS.users);
    
    const [user] = await db
      .insert(users)
      .values(encryptedUserData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: encryptedUserData.email,
          firstName: encryptedUserData.firstName,
          lastName: encryptedUserData.lastName,
          profileImageUrl: userData.profileImageUrl, // Profile image URL is not sensitive
          updatedAt: new Date(),
        },
      })
      .returning();
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  // Admin operations for access control
  async getAllUsers(): Promise<User[]> {
    const encryptedUsers = await db.select().from(users);
    return encryptedUsers.map(user => 
      decryptSensitiveFields(user, SENSITIVE_FIELDS.users)
    );
  }

  async approveUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) return undefined;
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) return undefined;
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  // Notification operations
  async updateUserTelegramSettings(userId: string, chatId: string, enabled: boolean): Promise<User> {
    const encryptedChatId = encryptText(chatId);
    const [user] = await db
      .update(users)
      .set({
        telegramChatId: encryptedChatId,
        notificationsEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  async updateUserEmailSettings(userId: string, senderEmail: string, senderPassword: string, enabled: boolean): Promise<User> {
    const encryptedEmail = encryptText(senderEmail);
    const encryptedPassword = encryptText(senderPassword);
    const [user] = await db
      .update(users)
      .set({
        emailSenderAddress: encryptedEmail,
        emailSenderPassword: encryptedPassword,
        emailEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return decryptSensitiveFields(user, SENSITIVE_FIELDS.users);
  }

  async getUsersWithNotifications(): Promise<User[]> {
    const encryptedUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.notificationsEnabled, true),
        eq(users.isApproved, true)
      ));
    return encryptedUsers.map(user => 
      decryptSensitiveFields(user, SENSITIVE_FIELDS.users)
    );
  }

  async disableNotificationsForChatId(chatId: string): Promise<void> {
    const encryptedChatId = encryptText(chatId);
    await db
      .update(users)
      .set({
        notificationsEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.telegramChatId, encryptedChatId));
  }

  // Employee methods (user-scoped)
  async getEmployees(userId: string): Promise<Employee[]> {
    const encryptedEmployees = await db.select().from(employees).where(eq(employees.userId, userId));
    return encryptedEmployees.map(emp => 
      decryptSensitiveFields(emp, SENSITIVE_FIELDS.employees)
    );
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    if (!employee) return undefined;
    return decryptSensitiveFields(employee, SENSITIVE_FIELDS.employees);
  }

  async createEmployee(employee: InsertEmployee, userId: string): Promise<Employee> {
    const encryptedEmployee = encryptSensitiveFields({ ...employee, userId }, SENSITIVE_FIELDS.employees);
    const [newEmployee] = await db
      .insert(employees)
      .values(encryptedEmployee)
      .returning();
    return decryptSensitiveFields(newEmployee, SENSITIVE_FIELDS.employees);
  }

  async updateEmployee(id: number, updates: Partial<InsertEmployee>, userId: string): Promise<Employee | undefined> {
    const encryptedUpdates = encryptSensitiveFields(updates, SENSITIVE_FIELDS.employees);
    const [updated] = await db
      .update(employees)
      .set(encryptedUpdates)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    if (!updated) return undefined;
    return decryptSensitiveFields(updated, SENSITIVE_FIELDS.employees);
  }

  async deleteEmployee(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(employees).where(and(eq(employees.id, id), eq(employees.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async linkEmployeeToUser(employeeId: number, linkedUserId: string | null, managerId: string): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({ linkedUserId })
      .where(and(eq(employees.id, employeeId), eq(employees.userId, managerId)))
      .returning();
    if (!updated) return undefined;
    return decryptSensitiveFields(updated, SENSITIVE_FIELDS.employees);
  }

  // Meeting methods (user-scoped)
  async getMeetings(userId: string): Promise<Meeting[]> {
    const encryptedMeetings = await db.select().from(meetings).where(eq(meetings.userId, userId));
    return encryptedMeetings.map(meeting => 
      decryptSensitiveFields(meeting, SENSITIVE_FIELDS.meetings)
    );
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return undefined;
    return decryptSensitiveFields(meeting, SENSITIVE_FIELDS.meetings);
  }

  async createMeeting(meeting: InsertMeeting, userId: string): Promise<Meeting> {
    const encryptedMeeting = encryptSensitiveFields({
      ...meeting,
      title: meeting.title || null,
      userId
    }, SENSITIVE_FIELDS.meetings);
    const [newMeeting] = await db
      .insert(meetings)
      .values(encryptedMeeting)
      .returning();
    return decryptSensitiveFields(newMeeting, SENSITIVE_FIELDS.meetings);
  }

  async updateMeeting(id: number, updates: Partial<InsertMeeting>, userId: string): Promise<Meeting | undefined> {
    const encryptedUpdates = encryptSensitiveFields(updates, SENSITIVE_FIELDS.meetings);
    const [updated] = await db
      .update(meetings)
      .set(encryptedUpdates)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId)))
      .returning();
    if (!updated) return undefined;
    return decryptSensitiveFields(updated, SENSITIVE_FIELDS.meetings);
  }

  async deleteMeeting(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateMeetingEmailStatus(meetingId: number, emailSent: boolean): Promise<void> {
    await db
      .update(meetings)
      .set({ emailSent })
      .where(eq(meetings.id, meetingId));
  }

  // Action methods (user-scoped, including actions assigned to the user)
  async getActions(userId: string): Promise<Action[]> {
    const encryptedActions = await db.select().from(actions).where(
      or(
        eq(actions.userId, userId), // Actions created by user
        eq(actions.assignedToUserId, userId) // Actions assigned to user
      )
    );
    return encryptedActions.map(action => 
      decryptSensitiveFields(action, SENSITIVE_FIELDS.actions)
    );
  }

  async getAction(id: number): Promise<Action | undefined> {
    const [action] = await db.select().from(actions).where(eq(actions.id, id));
    if (!action) return undefined;
    return decryptSensitiveFields(action, SENSITIVE_FIELDS.actions);
  }

  async createAction(action: InsertAction, userId: string): Promise<Action> {
    // Look up if the assignee is a linked employee
    let assignedToUserId: string | null = null;
    if (action.assignee) {
      const [linkedEmployee] = await db.select()
        .from(employees)
        .where(and(
          eq(employees.name, action.assignee),
          eq(employees.userId, userId)
        ));
      
      if (linkedEmployee?.linkedUserId) {
        assignedToUserId = linkedEmployee.linkedUserId;
      }
    }

    const encryptedAction = encryptSensitiveFields({
      ...action,
      status: action.status || "pending",
      priority: action.priority || "medium",
      meetingId: action.meetingId || null,
      userId,
      assignedToUserId
    }, SENSITIVE_FIELDS.actions);
    const [newAction] = await db
      .insert(actions)
      .values(encryptedAction)
      .returning();
    return decryptSensitiveFields(newAction, SENSITIVE_FIELDS.actions);
  }

  async updateAction(id: number, updates: UpdateAction, userId: string): Promise<Action | undefined> {
    const encryptedUpdates = encryptSensitiveFields(updates, SENSITIVE_FIELDS.actions);
    const [updated] = await db
      .update(actions)
      .set(encryptedUpdates)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)))
      .returning();
    if (!updated) return undefined;
    return decryptSensitiveFields(updated, SENSITIVE_FIELDS.actions);
  }

  async deleteAction(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(actions).where(and(eq(actions.id, id), eq(actions.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActionsByMeeting(meetingId: number): Promise<Action[]> {
    const encryptedActions = await db.select().from(actions).where(eq(actions.meetingId, meetingId));
    return encryptedActions.map(action => 
      decryptSensitiveFields(action, SENSITIVE_FIELDS.actions)
    );
  }

  async getActionsByStatus(status: string): Promise<Action[]> {
    const encryptedActions = await db.select().from(actions).where(eq(actions.status, status));
    return encryptedActions.map(action => 
      decryptSensitiveFields(action, SENSITIVE_FIELDS.actions)
    );
  }

  async getAssignedActions(userId: string): Promise<Action[]> {
    const encryptedActions = await db.select().from(actions).where(eq(actions.assignedToUserId, userId));
    return encryptedActions.map(action => 
      decryptSensitiveFields(action, SENSITIVE_FIELDS.actions)
    );
  }

  async getStats(userId: string): Promise<{
    totalEmployees: number;
    totalMeetings: number;
    totalActions: number;
    activeActions: number;
    completedActions: number;
    overdueActions: number;
  }> {
    const [employeeCount] = await db.select({ count: count() }).from(employees).where(eq(employees.userId, userId));
    const [meetingCount] = await db.select({ count: count() }).from(meetings).where(eq(meetings.userId, userId));
    const allActions = await db.select().from(actions).where(eq(actions.userId, userId));
    
    return {
      totalEmployees: employeeCount?.count || 0,
      totalMeetings: meetingCount?.count || 0,
      totalActions: allActions.length,
      activeActions: allActions.filter(a => a.status !== ActionStatus.COMPLETED).length,
      completedActions: allActions.filter(a => a.status === ActionStatus.COMPLETED).length,
      overdueActions: allActions.filter(a => a.priority === "high" && a.status !== ActionStatus.COMPLETED).length,
    };
  }

  // Notification schedule methods
  async getNotificationSchedules(userId: string): Promise<NotificationSchedule[]> {
    return await db.select().from(notificationSchedules).where(eq(notificationSchedules.userId, userId));
  }

  async createNotificationSchedule(schedule: InsertNotificationSchedule, userId: string): Promise<NotificationSchedule> {
    const [newSchedule] = await db
      .insert(notificationSchedules)
      .values({ ...schedule, userId })
      .returning();
    return newSchedule;
  }

  async updateNotificationSchedule(id: number, updates: UpdateNotificationSchedule, userId: string): Promise<NotificationSchedule | undefined> {
    const [updated] = await db
      .update(notificationSchedules)
      .set(updates)
      .where(and(eq(notificationSchedules.id, id), eq(notificationSchedules.userId, userId)))
      .returning();
    return updated;
  }

  async deleteNotificationSchedule(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(notificationSchedules)
      .where(and(eq(notificationSchedules.id, id), eq(notificationSchedules.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement> {
    const [newUserAchievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId, isViewed: false })
      .returning();
    return newUserAchievement;
  }

  async markAchievementViewed(userAchievementId: number, userId: string): Promise<boolean> {
    const result = await db
      .update(userAchievements)
      .set({ isViewed: true })
      .where(and(eq(userAchievements.id, userAchievementId), eq(userAchievements.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
