/**
 * Type Definitions
 * 
 * Central location for all TypeScript types used in the application.
 * These types should be used throughout the codebase for type safety.
 */

import { User as PrismaUser, Subscription, Streak, LeaderboardEntry } from '@prisma/client'

// ============================================
// User Types
// ============================================

export type UserRole = 'STUDENT' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  avatarUrl: string | null
  branchId: string | null
  specialization: string | null
  secondLanguage: string | null
  studyLanguage: string | null
  uiLanguage: string
  dailyStudyGoal: number | null
  onboardingCompleted: boolean
  onboardingStep: number
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserWithSubscription extends User {
  subscription: Subscription | null
  streak: Streak | null
  leaderboardEntry: LeaderboardEntry | null
}

// ============================================
// Authentication Types
// ============================================

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  inviteCode?: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
  isNewDevice?: boolean
}

// ============================================
// Curriculum Types
// ============================================

export interface Branch {
  id: string
  nameAr: string
  nameEn: string
  code: string
  description: string | null
  order: number
  isActive: boolean
}

export interface Subject {
  id: string
  branchId: string
  nameAr: string
  nameEn: string
  code: string | null
  description: string | null
  color: string | null
  icon: string | null
  order: number
  xpPerLesson: number
  isActive: boolean
  units: Unit[]
}

export interface Unit {
  id: string
  subjectId: string
  nameAr: string
  nameEn: string
  description: string | null
  order: number
  isActive: boolean
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  unitId: string
  nameAr: string
  nameEn: string
  description: string | null
  order: number
  duration: number | null
  isActive: boolean
}

export interface LessonWithProgress extends Lesson {
  progress: LessonProgress | null
}

export interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  doneVideo: boolean
  doneQuestions: boolean
  doneRevision: boolean
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  lastStudiedAt: Date | null
  timesStudied: number
}

// ============================================
// Task Types
// ============================================

export type TaskType = 'VIDEO' | 'QUESTIONS' | 'REVISION'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

export interface Task {
  id: string
  userId: string
  lessonId: string | null
  title: string
  description: string | null
  taskType: TaskType
  status: TaskStatus
  scheduledDate: Date | null
  dayOfWeek: number | null
  scheduledTime: string | null
  duration: number
  remainingDuration: number | null
  order: number
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Frontend Task type with nested lesson relation
export interface TaskFrontend {
  id: string
  title: string
  description?: string | null
  taskType: TaskType
  status: TaskStatus
  scheduledDate: Date | string | null
  duration: number
  dayOfWeek: number | null
  lessonId?: string | null
  lesson?: {
    id: string
    nameAr: string
    nameEn: string
    unit?: {
      id: string
      nameAr: string
      nameEn: string
      subject?: {
        id: string
        nameAr: string
        nameEn: string
        color: string | null
      }
    }
  } | null
}

export interface TaskWithLesson extends Task {
  lesson: Lesson | null
}

// ============================================
// Focus Session Types
// ============================================

export interface FocusSession {
  id: string
  userId: string
  taskId: string | null
  startedAt: Date
  endedAt: Date | null
  duration: number
  actualDuration: number | null
  wasCompleted: boolean
  brainDump: string | null
}

// ============================================
// Note Types
// ============================================

export interface Note {
  id: string
  userId: string
  subjectId: string | null
  lessonId: string | null
  title: string | null
  content: string
  color: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

// Frontend Note type with nested relations
export interface NoteFrontend {
  id: string
  title: string | null
  content: string
  subjectId: string | null
  lessonId: string | null
  color?: string | null
  isPinned?: boolean
  subject?: {
    id: string
    nameAr: string
    nameEn: string
    color?: string | null
  }
  lesson?: {
    id: string
    nameAr: string
    nameEn: string
  }
  createdAt: string | Date
}

// ============================================
// Private Lesson Types
// ============================================

export interface PrivateLesson {
  id: string
  userId: string
  subjectId: string | null
  teacherName: string
  subjectName: string
  centerName: string | null
  daysOfWeek: string // JSON array
  time: string
  duration: number
  location: string | null
  notes: string | null
  color: string | null
  isActive: boolean
}

// ============================================
// Planner Types
// ============================================

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

export interface DayTasks {
  date: Date
  dayOfWeek: DayOfWeek
  tasks: Task[]
  privateLessons: PrivateLesson[]
}

export interface WeeklyPlanner {
  saturday: DayTasks
  sunday: DayTasks
  monday: DayTasks
  tuesday: DayTasks
  wednesday: DayTasks
  thursday: DayTasks
  friday: DayTasks
}

// ============================================
// Analytics Types
// ============================================

export interface SubjectProgress {
  subjectId: string
  subjectName: string
  totalLessons: number
  completedLessons: number
  percentComplete: number
  xpEarned: number
}

export interface InsightData {
  overallProgress: number
  subjectProgress: SubjectProgress[]
  weakSubjects: SubjectProgress[]
  studyStreak: number
  totalStudyMinutes: number
  tasksCompleted: number
  focusSessionsCompleted: number
}

// ============================================
// Subscription Types
// ============================================

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED'

export interface SubscriptionPlan {
  id: string
  name: string
  nameAr: string
  description: string | null
  descriptionAr: string | null
  price: number
  durationDays: number
  features: string | null
  isActive: boolean
}

// ============================================
// System Settings Types
// ============================================

export interface SystemSettings {
  inviteOnlyMode: boolean
  subscriptionEnabled: boolean
  trialEnabled: boolean
  trialDays: number
  leaderboardEnabled: boolean
  testMode: boolean
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Onboarding Types
// ============================================

export interface OnboardingData {
  studyLanguage: 'arabic' | 'english'
  fullName: string
  branchId: string
  specialization?: 'science' | 'math'
  secondLanguage: 'french' | 'german'
  dailyStudyGoal: number
}

export const ONBOARDING_STEPS = [
  'welcome',
  'language',
  'name',
  'branch',
  'specialization',
  'secondLanguage',
  'dailyGoal',
  'complete'
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]

// ============================================
// UI Types
// ============================================

export interface NavItem {
  id: string
  label: string
  labelAr: string
  icon: string
  href: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// ============================================
// Translation Types
// ============================================

export type TranslationKey = 
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.search'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'auth.login'
  | 'auth.register'
  | 'auth.logout'
  | 'auth.email'
  | 'auth.password'
  | 'dashboard.today'
  | 'dashboard.subjects'
  | 'dashboard.planner'
  | 'dashboard.focus'
  | 'dashboard.notes'
  | 'dashboard.insights'
  | 'dashboard.settings'
