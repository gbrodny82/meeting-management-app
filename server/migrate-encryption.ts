#!/usr/bin/env tsx
/**
 * Migration script to encrypt existing data in the database
 * Run this once when deploying encryption to an existing database
 */

import { db } from './db';
import { employees, meetings, actions, users } from '@shared/schema';
import { encryptSensitiveFields, SENSITIVE_FIELDS } from './encryption';

async function migrateData() {
  console.log('🔄 Starting data encryption migration...');
  
  try {
    // Migrate employees
    console.log('📋 Encrypting employee data...');
    const allEmployees = await db.select().from(employees);
    for (const employee of allEmployees) {
      const encrypted = encryptSensitiveFields(employee, SENSITIVE_FIELDS.employees);
      await db.update(employees)
        .set({
          name: encrypted.name,
        })
        .where({ id: employee.id });
    }
    console.log(`✅ Encrypted ${allEmployees.length} employee records`);

    // Migrate meetings
    console.log('🤝 Encrypting meeting data...');
    const allMeetings = await db.select().from(meetings);
    for (const meeting of allMeetings) {
      const encrypted = encryptSensitiveFields(meeting, SENSITIVE_FIELDS.meetings);
      await db.update(meetings)
        .set({
          employeeName: encrypted.employeeName,
          title: encrypted.title,
          notes: encrypted.notes,
        })
        .where({ id: meeting.id });
    }
    console.log(`✅ Encrypted ${allMeetings.length} meeting records`);

    // Migrate actions
    console.log('✅ Encrypting action data...');
    const allActions = await db.select().from(actions);
    for (const action of allActions) {
      const encrypted = encryptSensitiveFields(action, SENSITIVE_FIELDS.actions);
      await db.update(actions)
        .set({
          text: encrypted.text,
          assignee: encrypted.assignee,
          employeeName: encrypted.employeeName,
        })
        .where({ id: action.id });
    }
    console.log(`✅ Encrypted ${allActions.length} action records`);

    // Migrate users
    console.log('👤 Encrypting user data...');
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      const encrypted = encryptSensitiveFields(user, SENSITIVE_FIELDS.users);
      await db.update(users)
        .set({
          email: encrypted.email,
          firstName: encrypted.firstName,
          lastName: encrypted.lastName,
          telegramChatId: encrypted.telegramChatId,
        })
        .where({ id: user.id });
    }
    console.log(`✅ Encrypted ${allUsers.length} user records`);

    console.log('🎉 Data encryption migration completed successfully!');
    console.log('⚠️  Make sure to set a strong ENCRYPTION_KEY environment variable for production!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Only run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateData };