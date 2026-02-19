# Matrixa API Documentation

> Complete API endpoint reference for Matrixa

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Authentication Endpoints](#authentication-endpoints)
6. [User Endpoints](#user-endpoints)
7. [Task Endpoints](#task-endpoints)
8. [Notes Endpoints](#notes-endpoints)
9. [Focus Session Endpoints](#focus-session-endpoints)
10. [Subjects & Curriculum Endpoints](#subjects--curriculum-endpoints)
11. [Private Lessons Endpoints](#private-lessons-endpoints)
12. [Subscription Endpoints](#subscription-endpoints)
13. [Leaderboard Endpoints](#leaderboard-endpoints)
14. [Announcement Endpoints](#announcement-endpoints)
15. [Admin Endpoints](#admin-endpoints)

---

## Overview

### Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication Method

All authenticated endpoints use **HttpOnly cookies** for JWT token storage:

- `accessToken` - Short-lived token (15 minutes)
- `refreshToken` - Long-lived token (7 days)

Tokens are automatically sent with requests. No manual header setup required.

### Rate Limiting

Auth endpoints have rate limiting:
- `/api/auth/login` - 5 requests per minute
- `/api/auth/register` - 3 requests per minute
- `/api/auth/refresh` - 10 requests per minute

### Content Type

```
Content-Type: application/json
```

---

## Authentication

### Token Types

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Token renewal |

### Token Refresh

When access token expires, use the refresh endpoint:

```typescript
POST /api/auth/refresh
// Uses refreshToken from cookie
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `SUBSCRIPTION_REQUIRED` | 402 | Subscription needed |
| `INVITE_CODE_INVALID` | 400 | Invalid invite code |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `SESSION_EXPIRED` | 401 | Session no longer valid |

---

## Authentication Endpoints

### Register

Create a new user account.

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "inviteCode": "WELCOME2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "student@example.com",
    "role": "STUDENT",
    "onboardingCompleted": false
  }
}
```

**Errors:**
- `400` - Invalid input / Invalid invite code
- `409` - Email already exists

---

### Login

Authenticate user and receive tokens.

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "student@example.com",
    "role": "STUDENT",
    "fullName": "Ahmed Mohamed",
    "onboardingCompleted": true
  },
  "isNewDevice": false,
  "subscription": {
    "isActive": true,
    "isInTrial": true,
    "remainingTrialDays": 10
  }
}
```

**Cookies Set:**
- `accessToken` - HttpOnly, 15 min expiry
- `refreshToken` - HttpOnly, 7 day expiry
- `onboardingCompleted` - If user completed onboarding
- `subscriptionEnabled` - System setting
- `subscriptionActive` - User subscription status
- `isInTrial` - Trial status
- `remainingTrialDays` - Days left in trial

**Errors:**
- `400` - Invalid input
- `401` - Invalid credentials

---

### Logout

End user session.

```
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Refresh Token

Get new access token.

```
POST /api/auth/refresh
```

**Request:** Uses `refreshToken` cookie

**Response (200):**
```json
{
  "success": true
}
```

**Cookies Set:**
- `accessToken` - New access token

**Errors:**
- `401` - Invalid or expired refresh token

---

### Get Current User

Get authenticated user details.

```
GET /api/auth/me
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "student@example.com",
    "role": "STUDENT",
    "fullName": "Ahmed Mohamed",
    "branchId": "clx...",
    "specialization": "science",
    "dailyStudyGoal": 120,
    "onboardingCompleted": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Not authenticated

---

### Forgot Password

Request a password reset email.

```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists, a reset link has been sent"
}
```

---

### Verify Reset Token

Verify password reset token.

```
GET /api/auth/forgot-password?token=xxx
```

**Response (200):**
```json
{
  "success": true,
  "email": "student@example.com"
}
```

**Errors:**
- `400` - Invalid or expired token

---

## User Endpoints

### Complete Onboarding

Finish user onboarding flow.

```
POST /api/user/onboarding
```

**Request Body:**
```json
{
  "fullName": "Ahmed Mohamed",
  "branchId": "clx...",
  "specialization": "science",
  "secondLanguage": "french",
  "studyLanguage": "arabic",
  "uiLanguage": "arabic",
  "dailyStudyGoal": 120
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "onboardingCompleted": true,
    ...
  }
}
```

---

### Get User Settings

Get user preferences.

```
GET /api/user/settings
```

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "uiLanguage": "arabic",
    "dailyStudyGoal": 120,
    "notificationsEnabled": true
  }
}
```

---

### Update User Settings

Update user preferences.

```
PATCH /api/user/settings
```

**Request Body:**
```json
{
  "dailyStudyGoal": 180,
  "notificationsEnabled": false
}
```

**Response (200):**
```json
{
  "success": true,
  "settings": { ... }
}
```

---

### Change Password

Change user password.

```
POST /api/user/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Invalid current password

---

### Upload Avatar

Upload user avatar image.

```
POST /api/user/avatar
```

**Request:** `multipart/form-data` with `avatar` file

**Response (200):**
```json
{
  "success": true,
  "avatarUrl": "/uploads/avatars/xxx.jpg"
}
```

---

## Task Endpoints

### List Tasks

Get all tasks for current user.

```
GET /api/tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Filter by date (ISO format) |
| `subjectId` | string | Filter by subject |
| `status` | string | Filter by status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED) |

**Response (200):**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "clx...",
      "title": "Study Algebra",
      "description": "Complete chapter 1 exercises",
      "taskType": "VIDEO",
      "status": "PENDING",
      "scheduledDate": "2024-01-15T00:00:00.000Z",
      "dayOfWeek": 1,
      "duration": 45,
      "order": 0,
      "lesson": {
        "id": "clx...",
        "nameAr": "المعادلات",
        "unit": {
          "subject": {
            "id": "clx...",
            "nameAr": "الرياضيات",
            "color": "#8B5CF6"
          }
        }
      }
    }
  ]
}
```

---

### Create Task

Create a new task.

```
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "Study Algebra",
  "description": "Complete chapter 1 exercises",
  "taskType": "VIDEO",
  "scheduledDate": "2024-01-15",
  "duration": 45,
  "lessonId": "clx...",
  "dayOfWeek": 1,
  "scheduledTime": "14:00"
}
```

**Response (201):**
```json
{
  "success": true,
  "task": {
    "id": "clx...",
    "title": "Study Algebra",
    ...
  }
}
```

**Errors:**
- `400` - Invalid input
- `404` - Lesson not found (if lessonId provided)

---

### Get Today's Tasks

Get tasks scheduled for today.

```
GET /api/tasks/today
```

**Response (200):**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "clx...",
      "title": "Study Algebra",
      "status": "PENDING",
      "duration": 45,
      ...
    }
  ],
  "summary": {
    "total": 5,
    "completed": 2,
    "remaining": 3,
    "totalMinutes": 180
  }
}
```

---

### Update Task

Update task details.

```
PATCH /api/tasks/[id]
```

**Request Body:**
```json
{
  "title": "Updated title",
  "scheduledDate": "2024-01-16",
  "duration": 60
}
```

**Response (200):**
```json
{
  "success": true,
  "task": { ... }
}
```

---

### Delete Task

Delete a task.

```
DELETE /api/tasks/[id]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted"
}
```

---

### Complete Task

Mark task as completed.

```
POST /api/tasks/[id]/complete
```

**Response (200):**
```json
{
  "success": true,
  "task": {
    "id": "clx...",
    "status": "COMPLETED",
    "completedAt": "2024-01-15T14:30:00.000Z"
  },
  "streakUpdated": true
}
```

---

## Notes Endpoints

### List Notes

Get all notes for current user.

```
GET /api/notes
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `subjectId` | string | Filter by subject |
| `lessonId` | string | Filter by lesson |
| `search` | string | Search in title/content |

**Response (200):**
```json
{
  "success": true,
  "notes": [
    {
      "id": "clx...",
      "title": "Algebra Notes",
      "content": "# Important formulas...",
      "subject": {
        "id": "clx...",
        "nameAr": "الرياضيات",
        "color": "#8B5CF6"
      },
      "lesson": {
        "id": "clx...",
        "nameAr": "المعادلات"
      },
      "isPinned": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### Create Note

Create a new note.

```
POST /api/notes
```

**Request Body:**
```json
{
  "title": "Algebra Notes",
  "content": "# Important formulas...",
  "subjectId": "clx...",
  "lessonId": "clx..."
}
```

**Response (201):**
```json
{
  "success": true,
  "note": { ... }
}
```

---

### Update Note

Update note content.

```
PATCH /api/notes/[id]
```

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "subjectId": "clx...",
  "lessonId": null
}
```

---

### Delete Note

Delete a note.

```
DELETE /api/notes/[id]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Note deleted"
}
```

---

## Focus Session Endpoints

### List Focus Sessions

Get focus session history.

```
GET /api/focus-sessions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `subjectId` | string | Filter by subject |
| `limit` | number | Limit results (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "clx...",
      "startedAt": "2024-01-15T14:00:00.000Z",
      "endedAt": "2024-01-15T14:25:00.000Z",
      "duration": 1500,
      "actualDuration": 1500,
      "wasCompleted": true,
      "videosWatched": 2,
      "questionsSolved": 10,
      "revisionsCompleted": 1,
      "brainDump": "Notes from session...",
      "subject": { "nameAr": "الرياضيات" },
      "lesson": { "nameAr": "المعادلات" }
    }
  ]
}
```

---

### Create Focus Session

Record a completed focus session.

```
POST /api/focus-sessions
```

**Request Body:**
```json
{
  "duration": 1500,
  "actualDuration": 1500,
  "wasCompleted": true,
  "brainDump": "Notes from session...",
  "videosWatched": 2,
  "questionsSolved": 10,
  "revisionsCompleted": 1,
  "subjectId": "clx...",
  "lessonId": "clx...",
  "notes": "Post-session notes"
}
```

**Response (201):**
```json
{
  "success": true,
  "session": { ... }
}
```

---

## Subjects & Curriculum Endpoints

### List Branches

Get all curriculum branches.

```
GET /api/branches
```

**Response (200):**
```json
{
  "success": true,
  "branches": [
    {
      "id": "clx...",
      "nameAr": "علمي",
      "nameEn": "Scientific",
      "code": "scientific"
    },
    {
      "id": "clx...",
      "nameAr": "أدبي",
      "nameEn": "Literary",
      "code": "literary"
    }
  ]
}
```

---

### List Subjects

Get subjects (optionally filtered by branch).

```
GET /api/subjects
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | string | Filter by branch |

**Response (200):**
```json
{
  "success": true,
  "subjects": [
    {
      "id": "clx...",
      "nameAr": "الرياضيات",
      "nameEn": "Mathematics",
      "color": "#8B5CF6",
      "icon": "calculator",
      "xpPerLesson": 10,
      "units": [
        {
          "id": "clx...",
          "nameAr": "الجبر",
          "lessons": [...]
        }
      ]
    }
  ]
}
```

---

### Update Lesson Progress

Update progress on a specific lesson.

```
PATCH /api/lessons/[id]/progress
```

**Request Body:**
```json
{
  "doneVideo": true,
  "doneQuestions": true,
  "doneRevision": false,
  "confidenceLevel": "HIGH"
}
```

**Response (200):**
```json
{
  "success": true,
  "progress": {
    "doneVideo": true,
    "doneQuestions": true,
    "doneRevision": false,
    "confidenceLevel": "HIGH",
    "lastStudiedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

---

## Private Lessons Endpoints

### List Private Lessons

Get all private lessons for current user.

```
GET /api/private-lessons
```

**Response (200):**
```json
{
  "success": true,
  "lessons": [
    {
      "id": "clx...",
      "teacherName": "أستاذ أحمد",
      "subjectName": "الفيزياء",
      "centerName": "مركز النور",
      "daysOfWeek": "[0, 2, 4]",
      "time": "16:00",
      "duration": 90,
      "location": "قاعة 5",
      "color": "#F59E0B",
      "isActive": true
    }
  ]
}
```

---

### Create Private Lesson

Create a new private lesson.

```
POST /api/private-lessons
```

**Request Body:**
```json
{
  "teacherName": "أستاذ أحمد",
  "subjectName": "الفيزياء",
  "centerName": "مركز النور",
  "daysOfWeek": [0, 2, 4],
  "time": "16:00",
  "duration": 90,
  "location": "قاعة 5",
  "color": "#F59E0B",
  "notes": "Bring calculator"
}
```

**Response (201):**
```json
{
  "success": true,
  "lesson": { ... }
}
```

---

### Update Private Lesson

Update a private lesson.

```
PATCH /api/private-lessons/[id]
```

---

### Delete Private Lesson

Soft delete a private lesson.

```
DELETE /api/private-lessons/[id]
```

---

## Subscription Endpoints

### Get Subscription Status

Get current user's subscription status.

```
GET /api/subscription/status
```

**Response (200):**
```json
{
  "success": true,
  "status": {
    "status": "TRIAL",
    "isActive": true,
    "isInTrial": true,
    "trialEnd": "2024-01-29T00:00:00.000Z",
    "remainingTrialDays": 14,
    "plan": null
  }
}
```

---

### Get Available Plans

Get all available subscription plans.

```
GET /api/subscription/plans
```

**Response (200):**
```json
{
  "success": true,
  "plans": [
    {
      "id": "clx...",
      "name": "Monthly",
      "nameAr": "شهري",
      "description": "Monthly subscription",
      "price": 99,
      "durationDays": 30,
      "features": ["Full access", "All subjects", "Priority support"]
    },
    {
      "id": "clx...",
      "name": "Quarterly",
      "nameAr": "ربع سنوي",
      "price": 249,
      "durationDays": 90,
      "features": [...]
    }
  ]
}
```

---

### Create Payment

Initialize a payment transaction.

```
POST /api/payment
```

**Request Body:**
```json
{
  "planId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "paymentId": "pay_xxx",
  "paymentUrl": "https://payment-gateway.com/pay/xxx"
}
```

---

### Payment Webhook

Handle payment completion (called by payment gateway).

```
POST /api/payment/webhook
```

**Request Body:** Payment gateway specific payload

**Response (200):**
```json
{
  "success": true
}
```

---

## Leaderboard Endpoints

### Get Leaderboard

Get leaderboard rankings.

```
GET /api/leaderboard
```

**Response (200):**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "clx...",
      "fullName": "Ahmed M.",
      "score": 1250,
      "studyMinutes": 1200,
      "tasksCompleted": 45,
      "focusSessions": 20
    }
  ],
  "currentUser": {
    "rank": 15,
    "score": 450,
    ...
  }
}
```

---

### Opt In/Out of Leaderboard

Toggle leaderboard participation.

```
POST /api/leaderboard/opt-in
```

**Request Body:**
```json
{
  "optIn": true
}
```

**Response (200):**
```json
{
  "success": true,
  "isOptedIn": true
}
```

---

## Announcement Endpoints

### Get Active Announcements

Get all active announcements for students.

```
GET /api/announcements
```

**Response (200):**
```json
{
  "success": true,
  "announcements": [
    {
      "id": "clx...",
      "title": "System Maintenance",
      "message": "Scheduled maintenance on...",
      "type": "WARNING",
      "priority": 1,
      "showBanner": true,
      "isDismissible": true,
      "startsAt": "2024-01-15T00:00:00.000Z",
      "endsAt": "2024-01-20T00:00:00.000Z"
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require `ADMIN` role.

### Admin Dashboard Stats

```
GET /api/admin/stats
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "trialUsers": 120,
    "newUsersToday": 15,
    "expiredSubscriptions": 8,
    "totalSubscriptions": 450,
    "revenue": {
      "total": 45000,
      "thisMonth": 5000
    }
  }
}
```

---

### List Users

```
GET /api/admin/users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Results per page |
| `search` | string | Search by email/name |
| `role` | string | Filter by role |

---

### Update User

```
PATCH /api/admin/users/[id]
```

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "role": "STUDENT"
}
```

---

### Ban User

```
POST /api/admin/users/[id]/ban
```

**Request Body:**
```json
{
  "reason": "Violation of terms"
}
```

---

### Reset User Password

```
POST /api/admin/users/[id]/reset-password
```

**Response (200):**
```json
{
  "success": true,
  "tempPassword": "TempPass123!"
}
```

---

### Impersonate User

```
POST /api/admin/impersonate
```

**Request Body:**
```json
{
  "userId": "clx..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Impersonation started"
}
```

---

### Delete User

```
DELETE /api/admin/users/[id]
```

---

### Curriculum Management

#### Branches

```
GET    /api/admin/curriculum/branches
POST   /api/admin/curriculum/branches
PATCH  /api/admin/curriculum/branches/[id]
DELETE /api/admin/curriculum/branches/[id]
```

#### Subjects

```
GET    /api/admin/curriculum/subjects
POST   /api/admin/curriculum/subjects
PATCH  /api/admin/curriculum/subjects/[id]
DELETE /api/admin/curriculum/subjects/[id]
```

#### Units

```
GET    /api/admin/curriculum/units
POST   /api/admin/curriculum/units
PATCH  /api/admin/curriculum/units/[id]
DELETE /api/admin/curriculum/units/[id]
```

#### Lessons

```
GET    /api/admin/curriculum/lessons
POST   /api/admin/curriculum/lessons
PATCH  /api/admin/curriculum/lessons/[id]
DELETE /api/admin/curriculum/lessons/[id]
```

#### Import Curriculum

```
POST /api/admin/curriculum/import
```

**Request:** `multipart/form-data` with file (XLSX, CSV, or JSON)

**Response (200):**
```json
{
  "success": true,
  "imported": {
    "branches": 2,
    "subjects": 10,
    "units": 45,
    "lessons": 200
  }
}
```

#### Export Curriculum

```
GET /api/admin/curriculum/export?format=xlsx
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | Export format: `xlsx`, `csv`, or `json` |

**Response:** File download with proper encoding (UTF-8 BOM for CSV)

---

### Invite Code Management

#### List Invite Codes

```
GET /api/admin/invites
```

**Response (200):**
```json
{
  "success": true,
  "codes": [
    {
      "id": "clx...",
      "code": "WELCOME2024",
      "maxUses": 100,
      "currentUses": 45,
      "expiresAt": "2024-12-31T00:00:00.000Z",
      "isActive": true,
      "createdBy": {
        "email": "admin@matrixa.com"
      }
    }
  ]
}
```

#### Create Invite Code

```
POST /api/admin/invites
```

**Request Body:**
```json
{
  "code": "NEWYEAR2024",
  "maxUses": 50,
  "expiresAt": "2024-12-31T00:00:00.000Z"
}
```

#### Delete Invite Code

```
DELETE /api/admin/invites/[id]
```

---

### Subscription Plans Management

#### List All Plans

```
GET /api/admin/plans
```

#### Create Plan

```
POST /api/admin/plans
```

**Request Body:**
```json
{
  "name": "Annual",
  "nameAr": "سنوي",
  "description": "Annual subscription",
  "price": 799,
  "durationDays": 365,
  "features": {
    "fullAccess": true,
    "progressTracking": true,
    "focusSessions": true,
    "notesStorage": true,
    "advancedInsights": true,
    "prioritySupport": true
  },
  "isActive": true
}
```

**Note:** Features are now toggle switches, not text input.

#### Update Plan

```
PATCH /api/admin/plans/[id]
```

#### Delete Plan

```
DELETE /api/admin/plans/[id]
```

---

### System Settings

#### Get Settings

```
GET /api/admin/settings
```

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "inviteOnlyMode": true,
    "subscriptionEnabled": true,
    "trialEnabled": true,
    "trialDays": 14,
    "leaderboardEnabled": true,
    "testMode": true,
    "maintenanceMode": false
  }
}
```

#### Update Settings

```
PATCH /api/admin/settings
```

**Request Body:**
```json
{
  "inviteOnlyMode": false,
  "trialDays": 7,
  "testMode": false,
  "maintenanceMode": true
}
```

---

### Analytics

```
GET /api/admin/analytics
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date (ISO) |
| `endDate` | string | End date (ISO) |

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "newUsers": 50,
    "activeUsers": 890,
    "dau": 450,
    "wau": 780,
    "mau": 1200,
    "churnedUsers": 5,
    "revenue": 5000,
    "popularSubjects": [
      { "name": "Mathematics", "studyMinutes": 15000 },
      { "name": "Physics", "studyMinutes": 12000 }
    ]
  }
}
```

---

### Audit Logs

```
GET /api/admin/audit-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Results per page |
| `userId` | string | Filter by user |
| `action` | string | Filter by action type |

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "clx...",
      "userId": "clx...",
      "user": { "email": "admin@matrixa.com" },
      "action": "USER_BANNED",
      "targetId": "clx...",
      "targetType": "User",
      "ipAddress": "192.168.1.1",
      "changes": { "reason": "Violation" },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

### Announcements Management

```
GET    /api/admin/announcements
POST   /api/admin/announcements
GET    /api/admin/announcements/[id]
PUT    /api/admin/announcements/[id]
DELETE /api/admin/announcements/[id]
```

**Announcement Types:**
- `INFO` - General information
- `WARNING` - Warning message
- `SUCCESS` - Success/update message
- `MAINTENANCE` - Maintenance notice
- `FEATURE` - New feature announcement

---

### Streak Management

```
GET    /api/admin/streaks
PATCH  /api/admin/streaks/[id]
POST   /api/admin/streaks/[id]/reset
```

---

### Leaderboard Management

```
GET    /api/admin/leaderboard/students
PATCH  /api/admin/leaderboard/students/[id]
POST   /api/admin/leaderboard/reset
```

---

### Badges Management

```
GET  /api/admin/badges
POST /api/admin/badges
```

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SETUP.md](SETUP.md) - Installation guide
- [EXTENDING.md](EXTENDING.md) - Development guide

---

*Last updated: 2025-01-18*
