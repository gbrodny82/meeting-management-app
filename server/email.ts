import nodemailer from 'nodemailer';
import { storage } from './storage';
import { decryptText } from './encryption';

interface MeetingEmailData {
  meetingId: number;
  title?: string;
  employeeName: string;
  date: string;
  notes: string;
  recipientEmail: string;
}

// Create reusable transporter using Gmail SMTP
async function createTransporter(userId: string) {
  const user = await storage.getUser(userId);
  if (!user?.emailSenderAddress || !user?.emailSenderPassword || !user?.emailEnabled) {
    throw new Error('Email configuration not found or disabled. Please configure email settings first.');
  }

  // Decrypt the email credentials
  const decryptedPassword = decryptText(user.emailSenderPassword);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.emailSenderAddress,
      pass: decryptedPassword,
    },
  });
}

export async function sendMeetingEmail(userId: string, meetingData: MeetingEmailData): Promise<void> {
  try {
    const transporter = await createTransporter(userId);
    const user = await storage.getUser(userId);
    
    if (!user?.emailSenderAddress) {
      throw new Error('Email sender address not configured');
    }

    const subject = meetingData.title 
      ? `Meeting Notes: ${meetingData.title} - ${meetingData.employeeName}`
      : `Meeting Notes: ${meetingData.employeeName} - ${new Date(meetingData.date).toLocaleDateString()}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0;">Meeting Summary</h1>
          ${meetingData.title ? `<h2 style="color: #666; margin: 0; font-size: 18px;">${meetingData.title}</h2>` : ''}
        </div>
        
        <div style="background-color: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold; color: #555;">Participant:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${meetingData.employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${new Date(meetingData.date).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
          <h3 style="color: #333; margin: 0 0 15px 0; border-bottom: 2px solid #007bff; padding-bottom: 8px;">Meeting Notes</h3>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #555; font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${meetingData.notes}</div>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This email was sent automatically from the Meeting Tracker application.
            <br>
            Meeting ID: ${meetingData.meetingId} | Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    const textBody = `
Meeting Summary
${meetingData.title ? `Title: ${meetingData.title}` : ''}
Participant: ${meetingData.employeeName}
Date: ${new Date(meetingData.date).toLocaleDateString()}

Meeting Notes:
${meetingData.notes}

---
This email was sent automatically from the Meeting Tracker application.
Meeting ID: ${meetingData.meetingId} | Generated on ${new Date().toLocaleString()}
    `;

    await transporter.sendMail({
      from: `"Meeting Tracker" <${user.emailSenderAddress}>`,
      to: meetingData.recipientEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    // Update meeting to mark email as sent
    await storage.updateMeetingEmailStatus(meetingData.meetingId, true);
    
    console.log(`Meeting email sent successfully to ${meetingData.recipientEmail} for meeting ${meetingData.meetingId}`);
  } catch (error) {
    console.error('Error sending meeting email:', error);
    throw new Error(`Failed to send meeting email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testEmailConfiguration(userId: string, testRecipient: string): Promise<void> {
  try {
    const transporter = await createTransporter(userId);
    const user = await storage.getUser(userId);
    
    if (!user?.emailSenderAddress) {
      throw new Error('Email sender address not configured');
    }

    const testSubject = 'Meeting Tracker - Email Configuration Test';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0;">✅ Email Configuration Test</h1>
        </div>
        
        <div style="background-color: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
          <p style="color: #333; line-height: 1.6;">
            Great news! Your Gmail SMTP configuration is working correctly.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; color: #666;"><strong>Sender:</strong> ${user.emailSenderAddress}</p>
            <p style="margin: 8px 0 0 0; color: #666;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            You can now receive meeting summaries automatically when you create meetings with email recipients.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This is a test email from the Meeting Tracker application.
          </p>
        </div>
      </div>
    `;

    const testText = `
Email Configuration Test - SUCCESS!

Your Gmail SMTP configuration is working correctly.

Sender: ${user.emailSenderAddress}
Test Time: ${new Date().toLocaleString()}

You can now receive meeting summaries automatically when you create meetings with email recipients.

---
This is a test email from the Meeting Tracker application.
    `;

    await transporter.sendMail({
      from: `"Meeting Tracker" <${user.emailSenderAddress}>`,
      to: testRecipient,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });

    console.log(`Test email sent successfully to ${testRecipient} from ${userId}`);
  } catch (error) {
    console.error('Error sending test email:', error);
    throw new Error(`Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}