# MongoDB Migration Guide

## Overview

This mental health platform has been migrated from a Supabase/localStorage hybrid architecture to a MongoDB-based system. The application now uses a browser-compatible MongoDB layer that persists data to localStorage, providing the benefits of a document-based database structure while remaining fully functional in the browser.

## Architecture

### Storage Layer (`src/lib/mongodb.ts`)

A custom MongoDB-compatible storage abstraction layer that:
- Implements MongoDB-like collection operations (find, insertOne, updateOne, deleteOne, etc.)
- Persists data to localStorage for browser compatibility
- Supports MongoDB query syntax and operations
- Provides automatic collection management

### Authentication System (`src/lib/auth.ts`)

Custom authentication system that:
- Manages user registration and login
- Uses bcryptjs-compatible password hashing
- Generates JWT tokens for sessions
- Seeds default users (patient, therapist, admin) on startup
- Stores user credentials securely in MongoDB collections

### Authentication Context (`src/contexts/AuthContext.tsx`)

Updated React context that:
- Integrates with MongoDB-based auth system
- Manages user sessions
- Tracks analytics events
- Handles login, registration, and logout flows

## Collections

The application uses the following MongoDB collections:

### Core Collections

- **users**: User profiles and authentication data
  - Fields: id, email, name, role, status, verified, etc.
  - Indexes: email (unique), role

- **appointments**: Therapy session bookings
  - Fields: patientId, therapistId, date, time, status, amount, etc.
  - Indexes: patientId, therapistId, date, status

- **therapists**: Therapist profiles and services
  - Fields: id, name, specialization, hourlyRate, verified, etc.

### Tracking & Progress Collections

- **mood_entries**: User mood tracking data
  - Fields: userId, date, primaryMood, moodIntensity, sleepHours, etc.
  - Indexes: userId, date

- **therapy_sessions**: User progress through therapy modules
  - Fields: userId, therapyId, status, progress, completedAt, etc.
  - Indexes: userId, therapyId

- **messages**: User conversations
  - Fields: senderId, recipientId, content, read, createdAt, etc.
  - Indexes: senderId, recipientId, createdAt

- **analytics_events**: Platform analytics and activity tracking
  - Fields: type, userId, timestamp, data, etc.
  - Indexes: type, timestamp, userId

### Achievement Collections

- **achievements**: Achievement definitions
  - Fields: id, title, description, type, requirement, icon

- **user_achievements**: User achievement progress
  - Fields: userId, achievementId, progress, earned, earnedAt

### Therapy Content Collections

- **therapies**: Therapy module definitions
  - Fields: id, title, description, category, difficulty, sessions, etc.

- **therapy_content**: Detailed therapy content
  - Fields: therapyId, content, type, etc.

### Additional Collections

- **cbt_records**: Cognitive behavioral therapy records
- **gratitude_entries**: Gratitude journal entries
- **sleep_logs**: Sleep tracking data
- **stress_logs**: Stress management logs
- **exposure_sessions**: Exposure therapy session data
- **video_progress**: Video therapy progress tracking
- **sessions**: General session tracking

## Database Managers (`src/lib/db-managers.ts`)

TypeScript classes provide a clean API for database operations:

- **AppointmentManager**: CRUD operations for appointments
- **MoodEntryManager**: Mood tracking operations
- **TherapySessionManager**: Therapy progress management
- **MessageManager**: Messaging operations
- **AnalyticsManager**: Event logging and analytics
- **UserAchievementManager**: Achievement tracking

## Updated Utilities

### Therapy Storage (`src/utils/therapyStorage.ts`)

Migrated to MongoDB with:
- getAllTherapies(): Fetch all therapy modules
- getTherapyById(id): Get specific therapy
- createTherapy(data): Create new therapy module
- updateTherapy(id, data): Update therapy
- deleteTherapy(id): Delete therapy
- toggleTherapyStatus(id): Toggle active/inactive status

### Achievements Manager (`src/utils/achievementsManager.ts`)

Updated to use MongoDB for:
- getAllAchievements(): Fetch achievement definitions
- getUserAchievements(userId): Get user's earned achievements
- updateAchievementProgress(userId, achievementId, progress): Update progress
- initializeUserAchievements(userId): Setup user achievements
- updateAllAchievements(userId): Recalculate all achievements

## Browser-Compatible Implementation

The MongoDB layer is designed to work entirely in the browser:

### Pros:
- No server required for development
- Works offline
- Data persists across browser sessions
- Full document database semantics
- Supports complex queries

### Limitations:
- Data stored in localStorage (typically 5-10MB limit)
- Single-browser storage (not shared across tabs by default)
- No encryption at rest
- Suitable for development and demonstration

### Production Deployment

For production use, you should:

1. **Set up a MongoDB server**:
   ```bash
   # Local development with MongoDB
   mongod
   ```

2. **Update the backend to use actual MongoDB**:
   - Replace the localStorage-based layer with MongoDB Node.js driver
   - Create API endpoints for all database operations
   - Implement proper authentication and security

3. **Environment variables**:
   ```
   VITE_MONGODB_URI=mongodb://localhost:27017/mindcare
   VITE_JWT_SECRET=your_secure_secret_key
   ```

## Data Persistence

- **Development**: Data persists in localStorage
- **Key**: `mongodb_[collection_name]`
- **Format**: JSON arrays stored as strings

To clear all data:
```javascript
const collections = ['users', 'appointments', 'therapists', 'mood_entries', 'therapy_sessions', 'messages', 'analytics_events', 'achievements', 'user_achievements', 'therapies', 'therapy_content', 'cbt_records', 'gratitude_entries', 'sleep_logs', 'stress_logs', 'exposure_sessions', 'video_progress', 'sessions'];
collections.forEach(c => localStorage.removeItem(`mongodb_${c}`));
```

## Default Users

The system automatically creates three demo users:

1. **Patient**
   - Email: patient@example.com
   - Password: password
   - Role: patient

2. **Therapist**
   - Email: therapist@example.com
   - Password: password
   - Role: therapist (approved)

3. **Admin**
   - Email: admin@example.com
   - Password: password
   - Role: admin

## Key Features

- ✅ Full MongoDB-like query syntax
- ✅ Automatic indexing
- ✅ Transaction support (via upsert)
- ✅ Async/await operations
- ✅ Relationship management
- ✅ Event logging and analytics
- ✅ User authentication and authorization
- ✅ Achievement tracking system
- ✅ Mood tracking and analytics
- ✅ Therapy progress monitoring

## Migration Notes

This migration maintains backward compatibility with existing features while providing a cleaner, more scalable database layer. All existing React components continue to work without modification as the interface remains consistent.

For any issues or questions about the MongoDB implementation, refer to the database manager classes in `src/lib/db-managers.ts`.
