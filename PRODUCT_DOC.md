# Meeting Management Platform - Product Documentation

## Vision
The Meeting Management Platform is designed to empower managers and team leaders to conduct more effective one-on-one and team meetings. By providing a centralized hub for meeting notes, action item tracking, and AI-driven insights, the platform ensures that every conversation leads to clear outcomes and continuous team development.

## Core Pillars
1. **Accountability**: Never lose track of a commitment. Action items are first-class citizens with clear owners and priority levels.
2. **Contextual Intelligence**: Leveraging AI to summarize meetings, analyze sentiment, and provide health insights across the team.
3. **Seamless Communication**: Integrated Telegram and Email notifications keep everyone aligned without manual follow-ups.
4. **Data Security**: Enterprise-grade encryption for all personally identifiable information (PII).

## Key Components & Features

### 1. Meeting Management
- **Structured Notes**: Capture detailed meeting minutes with support for smart action detection.
- **Dedicated Detail Pages**: Deep-linkable pages for every meeting to ensure clear context and history.
- **Smart Filtering**: Quickly find meetings by team member, date range, or keyword search.
- **Newest-First Organization**: Your most recent interactions are always front and center.

### 2. Action Item Tracking
- **Unified Action Dashboard**: A centralized view of all "Active" commitments across all meetings.
- **Intelligent Creation**: Auto-detects tasks within meeting notes (e.g., "TODO:", "ACTION:") for one-click creation.
- **Cross-User Visibility**: Actions assigned to team members automatically appear in their personal dashboards.
- **Status Management**: Track progress from 'To Do' to 'Completed' with priority indicators.

### 3. AI Insights (Powered by Google Gemini)
- **Meeting Summaries**: Automatically generated summaries that capture the essence of every discussion.
- **Sentiment Analysis**: Understand the emotional tone of interactions to gauge team morale.
- **Effectiveness Scoring**: AI-driven evaluation of meeting quality and outcome clarity.
- **Team Health Dashboard**: Aggregated insights to help managers identify trends and potential burnout.

### 4. Integration & Connectivity
- **Telegram Bot**: Create new action items and receive daily scheduled updates directly via Telegram.
- **Email Delivery**: Automatically send professional HTML meeting summaries to participants upon creation.
- **Notification Scheduling**: Highly flexible scheduling (Morning Updates, End of Day, Weekly Planning) using custom cron patterns.

### 5. Security & Multi-Tenancy
- **PII Encryption**: AES-256 encryption for employee names, notes, and user data.
- **User Isolation**: Robust multi-tenant architecture ensuring data privacy between different organizations.
- **Secure Authentication**: Integrated with Replit Auth for reliable access management.

## Technical Architecture
- **Frontend**: React 18, Tailwind CSS, shadcn/ui.
- **Backend**: Node.js / Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Storage**: Hybrid memory/PostgreSQL storage layer for high performance.
- **Automation**: Node-cron for scheduled tasks and notifications.
