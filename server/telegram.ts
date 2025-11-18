import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import { storage } from './storage';
import { db } from './db';
import { actions, meetings, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { decryptText } from './encryption';

let bot: TelegramBot | null = null;
let isPolling = false;

// Store ongoing conversations for action creation
const activeConversations = new Map<string, {
  step: 'waiting_for_text' | 'waiting_for_assignee' | 'waiting_for_priority';
  actionData: {
    text?: string;
    assignee?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  userId: string;
}>;

export async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('TELEGRAM_BOT_TOKEN not provided. Telegram notifications disabled.');
    return;
  }

  // Re-enabled with improved error handling

  try {
    // Prevent multiple instances
    if (bot && isPolling) {
      console.log('Telegram bot already running, skipping initialization');
      return;
    }

    // Stop existing bot if it exists
    if (bot) {
      try {
        await bot.stopPolling();
        isPolling = false;
      } catch (error) {
        // Ignore stop errors
      }
    }
    
    bot = new TelegramBot(token, { 
      polling: false // Don't auto-start
    });
    
    // Add error handling for polling conflicts
    bot.on('polling_error', (error: any) => {
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('Telegram polling conflict detected - will retry in 30 seconds');
        isPolling = false;
        // Stop polling and retry after delay
        try {
          bot?.stopPolling();
        } catch (stopError) {
          // Ignore stop errors
        }
        
        // Retry after 30 seconds
        setTimeout(async () => {
          if (bot && !isPolling) {
            try {
              await bot.startPolling({ restart: true });
              isPolling = true;
              console.log('Telegram bot polling restarted after conflict');
            } catch (retryError) {
              console.error('Failed to restart bot after conflict:', retryError);
            }
          }
        }, 30000);
      } else {
        console.error('Telegram polling error:', error);
      }
    });
    
    // Start polling with better error handling
    try {
      await bot.startPolling({ restart: false });
      isPolling = true;
      console.log('Telegram bot initialized successfully');
    } catch (startError: any) {
      if (startError.message?.includes('409 Conflict')) {
        console.log('Telegram bot conflict detected - using webhook mode instead');
        isPolling = false;
        return; // Don't throw error, just disable polling
      } else {
        console.error('Error starting Telegram bot polling:', startError);
        throw startError;
      }
    }
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    isPolling = false;
  }

  if (bot) {
    // Handle /start command
    bot.onText(/\/start/, async (msg: any) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username || msg.from?.first_name || 'User';
      
      await bot!.sendMessage(chatId, 
        `👋 Welcome to Meeting Tracker notifications!\n\n` +
        `To enable daily notifications:\n` +
        `1. Go to your Meeting Tracker settings\n` +
        `2. Enter this Chat ID: ${chatId}\n` +
        `3. Enable notifications\n\n` +
        `You'll receive daily summaries of your meetings and action items!`
      );
    });

    // Handle /stop command
    bot.onText(/\/stop/, async (msg: any) => {
      const chatId = msg.chat.id;
      
      // Find user by chat ID and disable notifications
      try {
        await storage.disableNotificationsForChatId(chatId.toString());
        await bot!.sendMessage(chatId, '🔕 Notifications disabled. Send /start to re-enable.');
      } catch (error) {
        await bot!.sendMessage(chatId, '❌ Error disabling notifications. Please try again.');
      }
    });

    // Handle /newaction command
    bot.onText(/\/newaction/, async (msg: any) => {
      const chatId = msg.chat.id.toString();
      
      try {
        // Find user by chat ID
        const user = await getUserByChatId(chatId);
        if (!user) {
          await bot!.sendMessage(chatId, '❌ User not found. Please make sure notifications are enabled in your settings.');
          return;
        }

        // Start action creation conversation
        activeConversations.set(chatId, {
          step: 'waiting_for_text',
          actionData: {},
          userId: user.id
        });

        await bot!.sendMessage(chatId, 
          '📝 *Create New Action Item*\n\n' +
          'What task would you like to create? Please describe the action item:',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await bot!.sendMessage(chatId, '❌ Error starting action creation. Please try again.');
      }
    });

    // Handle /cancel command
    bot.onText(/\/cancel/, async (msg: any) => {
      const chatId = msg.chat.id.toString();
      
      if (activeConversations.has(chatId)) {
        activeConversations.delete(chatId);
        await bot!.sendMessage(chatId, '❌ Action creation cancelled.');
      } else {
        await bot!.sendMessage(chatId, 'No active action creation to cancel.');
      }
    });

    // Handle /help command
    bot.onText(/\/help/, async (msg: any) => {
      const chatId = msg.chat.id;
      
      await bot!.sendMessage(chatId,
        '🤖 *Meeting Tracker Bot Commands*\n\n' +
        '/start - Enable notifications\n' +
        '/stop - Disable notifications\n' +
        '/newaction - Create a new action item\n' +
        '/cancel - Cancel action creation\n' +
        '/help - Show this help message\n\n' +
        '💡 You can also reply to daily notifications to quickly create related action items!',
        { parse_mode: 'Markdown' }
      );
    });

    // Handle text messages (for conversations)
    bot.on('message', async (msg: any) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text;

      // Skip if it's a command
      if (text?.startsWith('/')) return;

      // Handle ongoing conversations
      const conversation = activeConversations.get(chatId);
      if (conversation) {
        await handleConversationStep(chatId, text, conversation);
      }
    });

    // Schedule daily notifications at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await sendDailyNotifications();
    });

    console.log('Telegram bot commands and cron job set up');
  }
}

// Helper function to find user by chat ID
async function getUserByChatId(chatId: string): Promise<{ id: string; firstName?: string; lastName?: string } | null> {
  try {
    const allUsers = await storage.getUsersWithNotifications();
    // Find user with matching chat ID (already decrypted by storage layer)
    const user = allUsers.find(user => user.telegramChatId === chatId);
    return user ? {
      id: user.id,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined
    } : null;
  } catch (error) {
    console.error('Error finding user by chat ID:', error);
    return null;
  }
}

// Handle conversation steps for action creation
async function handleConversationStep(chatId: string, text: string, conversation: any) {
  try {
    switch (conversation.step) {
      case 'waiting_for_text':
        conversation.actionData.text = text;
        conversation.step = 'waiting_for_assignee';
        
        await bot!.sendMessage(chatId,
          '👤 Who should be assigned to this task?\n\n' +
          'Options:\n' +
          '• Type "me" to assign to yourself\n' +
          '• Type the name of a team member\n' +
          '• Type "skip" to leave unassigned',
          { parse_mode: 'Markdown' }
        );
        break;

      case 'waiting_for_assignee':
        if (text.toLowerCase() === 'me') {
          // Get user's name from database
          const user = await getUserByChatId(chatId);
          const fullName = user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : (user?.firstName || 'Me');
          conversation.actionData.assignee = fullName;
        } else if (text.toLowerCase() === 'skip') {
          conversation.actionData.assignee = 'Unassigned';
        } else {
          conversation.actionData.assignee = text;
        }
        
        conversation.step = 'waiting_for_priority';
        
        await bot!.sendMessage(chatId,
          '⚡ What priority should this task have?\n\n' +
          'Reply with:\n' +
          '• "high" for urgent tasks\n' +
          '• "medium" for normal tasks (default)\n' +
          '• "low" for when-possible tasks',
          { parse_mode: 'Markdown' }
        );
        break;

      case 'waiting_for_priority':
        const priority = text.toLowerCase();
        if (['high', 'medium', 'low'].includes(priority)) {
          conversation.actionData.priority = priority as 'low' | 'medium' | 'high';
        } else {
          conversation.actionData.priority = 'medium'; // default
        }

        // Create the action
        await createActionFromTelegram(chatId, conversation);
        activeConversations.delete(chatId);
        break;
    }
  } catch (error) {
    console.error('Error handling conversation step:', error);
    await bot!.sendMessage(chatId, '❌ Error processing your input. Please try again or use /cancel to start over.');
  }
}

// Create action item from Telegram conversation
async function createActionFromTelegram(chatId: string, conversation: any) {
  try {
    const { actionData, userId } = conversation;
    
    // Get the user who created this action
    const user = await getUserByChatId(chatId);
    if (!user) {
      await bot!.sendMessage(chatId, '❌ User not found. Please try again.');
      return;
    }

    // Use the user's name as the initiator/employeeName
    const initiatorName = user.firstName || 'Telegram User';

    const newAction = await storage.createAction({
      text: actionData.text,
      userId: userId,
      assignee: actionData.assignee,
      priority: actionData.priority || 'medium',
      status: 'pending',
      employeeName: initiatorName, // Use the actual user who created it
      meetingId: null // Not linked to specific meeting
    }, userId);

    const priority = (actionData.priority || 'medium') as 'high' | 'medium' | 'low';
    const priorityEmoji = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    }[priority];

    await bot!.sendMessage(chatId,
      `✅ *Action Created Successfully!*\n\n` +
      `📝 Task: ${actionData.text}\n` +
      `👤 Assigned to: ${actionData.assignee}\n` +
      `${priorityEmoji} Priority: ${actionData.priority || 'medium'}\n` +
      `🙋 Created by: ${initiatorName}\n\n` +
      `The action has been added to your Meeting Tracker dashboard.`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Error creating action from Telegram:', error);
    await bot!.sendMessage(chatId, '❌ Error creating action item. Please try again later.');
  }
}

export async function sendDailyNotifications() {
  if (!bot) return;

  try {
    const usersWithNotifications = await storage.getUsersWithNotifications();
    
    for (const user of usersWithNotifications) {
      if (!user.telegramChatId) continue;

      try {
        const message = await generateDailyMessage(user.id);
        // Note: telegramChatId is already decrypted by storage layer
        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'MarkdownV2' });
      } catch (error) {
        console.error(`Error sending notification to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending daily notifications:', error);
  }
}

async function generateDailyMessage(userId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's meetings (if any) using storage layer for proper decryption
  const allMeetings = await storage.getMeetings(userId);
  const todaysMeetings = allMeetings.filter(m => m.date === today).slice(0, 5);

  // Get active actions (pending + in-progress) using storage layer for proper decryption
  const allActions = await storage.getActions(userId);
  const activeActions = allActions.filter(a => a.status === 'pending' || a.status === 'in-progress').slice(0, 10);

  let message = `📅 *Daily Meeting Tracker Update*\n\n`;

  // Today's meetings
  if (todaysMeetings.length > 0) {
    message += `🗓️ *Today's Meetings \\(${todaysMeetings.length}\\):*\n`;
    for (const meeting of todaysMeetings) {
      // Escape markdown special characters in content
      const title = escapeMarkdown(meeting.title || 'Meeting');
      const employeeName = escapeMarkdown(meeting.employeeName);
      message += `• ${title} with ${employeeName}\n`;
    }
    message += '\n';
  } else {
    message += `✅ No meetings scheduled for today\n\n`;
  }

  // Active actions (pending + in-progress)
  if (activeActions.length > 0) {
    message += `⚠️ *Active Action Items \\(${activeActions.length}\\):*\n`;
    for (const action of activeActions.slice(0, 8)) {
      const priority = action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🟢';
      const statusIcon = action.status === 'in-progress' ? '🔄' : '⏳';
      // Show full text up to 120 characters to fit more content
      const actionText = escapeMarkdown(action.text.length > 120 ? action.text.substring(0, 117) + '...' : action.text);
      const assignee = escapeMarkdown(action.assignee);
      message += `${priority}${statusIcon} ${actionText} \\- ${assignee}\n`;
    }
    if (activeActions.length > 8) {
      message += `\\.\\.\\.and ${activeActions.length - 8} more\n`;
    }
    message += '\n';
  } else {
    message += `🎉 No active action items\\!\n\n`;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-app.replit.app';
  message += `📱 [Open Meeting Tracker](https://${escapeMarkdown(domain)})`;

  return message;
}

// Helper function to escape markdown special characters for MarkdownV2
function escapeMarkdown(text: string): string {
  if (!text) return '';
  // MarkdownV2 requires escaping these characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

export async function sendTestNotification(chatId: string) {
  if (!bot) throw new Error('Telegram bot not initialized');
  
  // Try to restart polling if it's stopped
  if (!isPolling) {
    try {
      await bot.startPolling({ restart: true });
      isPolling = true;
      console.log('Telegram bot polling restarted for test notification');
    } catch (error) {
      console.error('Failed to restart bot polling:', error);
      throw new Error('Telegram bot cannot be started - please check for conflicts');
    }
  }
  
  const message = `🧪 *Test Notification*\n\nYour Telegram notifications are working correctly\\!\n\nYou'll receive daily updates at 9:00 AM with:\n• Today's meetings\n• Pending action items\n• Quick access to your app`;
  
  await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
}

export async function sendTestDailyNotification(chatId: string, userId: string) {
  if (!bot) throw new Error('Telegram bot not initialized');
  
  console.log(`Sending test notification - Bot polling status: ${isPolling}`);
  
  // Try to restart polling if it's stopped
  if (!isPolling) {
    try {
      console.log('Attempting to restart bot polling...');
      await bot.startPolling({ restart: true });
      isPolling = true;
      console.log('Telegram bot polling restarted successfully');
      
      // Wait a moment for polling to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Failed to restart bot polling:', error);
      throw new Error(`Telegram bot cannot be started: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  const message = await generateDailyMessage(userId);
  console.log('Sending message to chat:', chatId);
  await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
  console.log('Test notification sent successfully');
}

// Export bot status for debugging
export function getBotStatus() {
  return {
    botInitialized: !!bot,
    isPolling,
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN
  };
}