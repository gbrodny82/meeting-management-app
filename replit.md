# Meeting Tracker Application

## Overview

This is a full-stack meeting tracker application built with React, Express.js, and PostgreSQL. The application helps managers track meetings with team members, manage action items, and maintain team information. It features a modern UI built with shadcn/ui components and provides a comprehensive dashboard for meeting management.

**Security Update**: The application now includes comprehensive data encryption for all personally identifiable information (PII) stored in the database, ensuring sensitive data remains protected even if the database is compromised.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a typical full-stack architecture with clear separation between frontend, backend, and database layers:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for local state

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: 
  - TanStack React Query for server state management
  - React Context API for global application state (search, filters)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful APIs with proper error handling
- **Middleware**: Request logging, JSON parsing, and error handling
- **Development**: Hot reloading with tsx

### Database Schema
The application uses three main entities:
- **Employees**: Team member information (name, role, department, relationship)
- **Meetings**: Meeting records with notes and employee associations
- **Actions**: Action items linked to meetings with status tracking

### UI Components Structure
- **Layout**: Main layout with sidebar navigation and top bar
- **Pages**: Dashboard, Actions, Meetings, Team, Settings
- **Components**: Reusable components for forms, cards, and data display
- **Design System**: Consistent styling with shadcn/ui components

## Data Flow

1. **Client Requests**: Frontend makes API calls using React Query
2. **API Processing**: Express server handles requests and validates data
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: Data flows back through the API to the frontend
5. **State Updates**: React Query manages caching and state synchronization

The application uses optimistic updates for better user experience and automatic cache invalidation to keep data fresh.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **@radix-ui/***: Accessible UI primitives for components

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **drizzle-kit**: Database migrations and schema management

### Storage Strategy
The application currently includes a memory storage implementation (MemStorage) as a fallback, but is configured to use PostgreSQL as the primary database through Drizzle ORM.

**Data Security**: All sensitive data is automatically encrypted before storage using AES encryption:
- Employee names, meeting titles/notes, action item text, user PII
- Backward-compatible encryption that works with existing data
- Automatic encryption/decryption handled by the storage layer
- Environment variable `ENCRYPTION_KEY` controls encryption (defaults to dev key with warning)

## Deployment Strategy

The application is designed for deployment on platforms like Replit:

- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Environment**: NODE_ENV-based configuration
- **Database**: Uses DATABASE_URL environment variable for PostgreSQL connection
- **Static Assets**: Frontend builds to dist/public, served by Express in production
- **Development**: Concurrent development with Vite dev server and Express API

The application includes Replit-specific configurations and development tools for seamless deployment and development experience.

## Recent Changes

**January 27, 2025 - Data Security Implementation**
- ✅ Added comprehensive AES encryption for all PII data
- ✅ Implemented backward-compatible encryption system with ENC: prefix
- ✅ Created automated encryption/decryption in storage layer
- ✅ Added data migration script for existing databases
- ✅ Documented security implementation in SECURITY.md
- ✅ Environment-based encryption key management
- ✅ Graceful error handling for decryption failures

**Security Features Added:**
- Employee names, meeting details, action items, and user data encryption
- Automatic encryption on data creation/update
- Transparent decryption on data retrieval
- Migration script for encrypting existing data
- Comprehensive security documentation

**January 27, 2025 - Meeting Action Integration**
- ✅ Added "Add Action" functionality within meeting cards
- ✅ Created AddActionForm component with team member dropdown
- ✅ Assignee field now includes "Me" option and all configured team members
- ✅ Actions created from meetings are properly linked and tracked
- ✅ Enhanced meeting cards with action item management interface

**January 27, 2025 - Smart Action Detection & Inline Creation**
- ✅ Implemented intelligent action pattern detection in meeting notes
- ✅ Auto-detects TODO:, ACTION:, [ ], @username, Follow up: patterns
- ✅ One-click conversion from detected patterns to draft actions
- ✅ Inline action editing with assignee and priority selection
- ✅ Draft actions saved together with meeting in single transaction
- ✅ Smart UI showing action count in save button and status indicators
- ✅ Enhanced user experience with real-time pattern recognition

**January 27, 2025 - Telegram Bot Action Creation**
- ✅ Added /newaction command for creating action items via Telegram
- ✅ Implemented interactive conversation flow (task → assignee → priority)
- ✅ Added proper user identification for action initiator tracking
- ✅ Enhanced bot with /help, /cancel commands for better UX
- ✅ Fixed employeeName to reflect actual action creator instead of random employee
- ✅ Integrated with user-scoped storage for multi-tenant support

**January 28, 2025 - AI-Powered Meeting Insights**
- ✅ Created comprehensive OpenAI GPT-4o integration for meeting analysis
- ✅ Built AI insights components with sentiment analysis and effectiveness scoring
- ✅ Added meeting insights to individual meeting cards with tabbed interface
- ✅ Created team insights dashboard for high-level team health analysis
- ✅ Implemented proper error handling for API quota limits and rate limiting
- ✅ Added detailed error messages with guidance for OpenAI billing issues
- ✅ Fixed Telegram bot 409 polling conflicts with proper singleton handling
- ✅ Temporarily disabled Telegram bot to resolve persistent polling issues

**January 28, 2025 - Multi-Tenancy & Google Gemini Integration**
- ✅ Successfully migrated AI insights from OpenAI to Google Gemini 2.5 Flash
- ✅ Fixed critical multi-tenancy security vulnerabilities in PostgreSQL storage
- ✅ Implemented proper user isolation for all CRUD operations (meetings, employees, actions)
- ✅ Added user ownership validation to prevent cross-user data access
- ✅ Enhanced action visibility to show actions assigned to users from other tenants
- ✅ Fixed Add Action form validation issue preventing action creation
- ✅ Updated error messaging to reflect Google AI instead of OpenAI services

**January 28, 2025 - Employee-to-User Linking System**
- ✅ Added `linkedUserId` field to employees database schema for system user connections
- ✅ Implemented linkEmployeeToUser method in both memory and PostgreSQL storage layers
- ✅ Created secure admin-only API endpoint `/api/admin/employees/:id/link` for linking operations
- ✅ Built EmployeeUserLink UI component with dropdown selection and visual indicators
- ✅ Integrated linking interface into Team Members page with admin-only visibility
- ✅ Added proper user selection from approved system users with Link/Unlink functionality
- ✅ Successfully tested linking functionality with live data (employee "Shlomi B" linked to system user)
- ✅ Confirmed proper security restrictions - only admin users can access linking features

**January 28, 2025 - Critical Action Assignment Bug Fix**
- ✅ Fixed critical issue where linked employees couldn't see assigned actions
- ✅ Enhanced action creation to automatically populate `assignedToUserId` field when assigning to linked employees
- ✅ Updated both PostgreSQL and memory storage implementations for proper user linking
- ✅ Added proper lookup logic to connect employee assignments to system user IDs
- ✅ Verified linked employees can now see actions assigned to them in their dashboard

**January 28, 2025 - Telegram Bot Restoration**
- ✅ Re-enabled Telegram bot functionality after resolving polling conflicts
- ✅ Enhanced error handling for bot initialization and polling status
- ✅ Fixed test notification endpoints to check both bot existence and polling status
- ✅ Successfully restored Telegram notifications and interactions for action management
- ✅ Confirmed bot can handle /newaction command and daily notification scheduling

**January 29, 2025 - Meeting Deletion Feature**
- ✅ Added delete meeting functionality with confirmation dialog
- ✅ Implemented secure DELETE API endpoint for meetings
- ✅ Created confirmation alert dialog to prevent accidental deletions
- ✅ Added dropdown menu to meeting cards with delete option
- ✅ Enhanced useDeleteMeeting hook with proper cache invalidation
- ✅ Includes warning about deletion of associated action items

**January 29, 2025 - Telegram Bot Fix**
- ✅ Re-enabled Telegram bot functionality after being disabled
- ✅ Improved error handling for polling conflicts
- ✅ Added better startup error handling with conflict detection
- ✅ Enhanced notification system with clearer error messages
- ✅ Successfully restored bot initialization and command setup
- ✅ Fixed rate limiting issues that were preventing app loading

**January 29, 2025 - Advanced Notification Scheduling System**
- ✅ Added comprehensive notification schedules database table with flexible configuration
- ✅ Created notification schedule management UI with preset patterns and custom options
- ✅ Built API endpoints for full CRUD operations on notification schedules
- ✅ Added dedicated "Schedules" tab to Settings page with intuitive interface
- ✅ Implemented schedule presets (Morning Update, End of Day, Weekly Planning, etc.)
- ✅ Added custom cron pattern support for advanced scheduling
- ✅ Integrated content selection options (actions, meetings, stats, custom messages)
- ✅ Enhanced Telegram bot with automatic conflict resolution and polling restart
- ✅ Fixed Telegram bot polling conflicts with improved error handling and retry logic

**New Notification Features:**
- Multiple notification schedules per user with individual enable/disable
- Preset schedule templates for common use cases
- Custom cron pattern support for advanced users
- Content filtering options (choose what to include in notifications)
- Custom message support for personalized notifications
- Real-time schedule management with instant updates
- Automatic bot recovery from polling conflicts

**January 29, 2025 - Gmail SMTP Email Integration**
- ✅ Implemented comprehensive Gmail SMTP email functionality using nodemailer
- ✅ Added secure email configuration with encrypted password storage
- ✅ Created Email Settings tab in Settings page with Gmail App Password setup
- ✅ Added email recipient field to meeting forms for automatic summary delivery
- ✅ Built professional HTML email templates for meeting notes with formatted content
- ✅ Integrated automatic email sending with meeting creation workflow
- ✅ Added test email functionality to verify Gmail configuration before use
- ✅ Enhanced PostgreSQL storage with encrypted email credentials support
- ✅ Implemented error handling that preserves meeting creation if email fails

**Email Features Added:**
- Gmail SMTP integration with App Password authentication
- Secure AES encryption for email credentials storage
- Professional HTML email templates with meeting details and participant info
- Automatic email delivery when creating meetings with specified recipients
- Test email functionality for configuration validation
- Email settings management with show/hide password toggle
- Multi-tenant email support with user-specific configurations
- Comprehensive error handling and logging for email operations