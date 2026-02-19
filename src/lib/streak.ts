/**
 * Streak Service
 * 
 * Handles streak tracking and updates based on daily activity.
 * Streak logic:
 * - If lastActivityDate is yesterday: increment streak
 * - If lastActivityDate is today: no change
 * - If lastActivityDate is before yesterday: reset streak to 1
 * - Update longestStreak if currentStreak is higher
 */

import { prisma } from '@/lib/db'

/**
 * Get the start of today (midnight) in local time
 */
function getTodayStart(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Get the start of yesterday (midnight) in local time
 */
function getYesterdayStart(): Date {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return yesterday
}

/**
 * Calculate the difference in days between two dates
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Update streak when user has activity
 * 
 * @param userId - The user's ID
 * @returns The updated streak record
 */
export async function updateStreakOnActivity(userId: string) {
  const today = getTodayStart()
  
  // Get or create streak record
  let streak = await prisma.streak.findUnique({
    where: { userId }
  })
  
  if (!streak) {
    // Create new streak record
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today
      }
    })
    return streak
  }
  
  const lastActivity = streak.lastActivityDate
  
  // Determine the new streak value
  let newStreak = streak.currentStreak
  
  if (!lastActivity) {
    // No previous activity - start streak
    newStreak = 1
  } else {
    const daysDiff = getDaysDifference(lastActivity, today)
    
    if (daysDiff === 0) {
      // Same day - no change needed
      return streak
    } else if (daysDiff === 1) {
      // Yesterday - increment streak
      newStreak = streak.currentStreak + 1
    } else {
      // More than 1 day gap - reset streak
      newStreak = 1
    }
  }
  
  // Update the streak
  const updatedStreak = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastActivityDate: today
    }
  })
  
  return updatedStreak
}

/**
 * Check if a streak should be broken (for cron job)
 * This is used to detect users who haven't been active
 * 
 * @returns Number of streaks broken
 */
export async function checkBrokenStreaks(): Promise<number> {
  const today = getTodayStart()
  const yesterday = getYesterdayStart()
  
  // Find all streaks where lastActivityDate is before yesterday
  // and currentStreak > 0
  const brokenStreaks = await prisma.streak.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastActivityDate: { lt: yesterday }
    }
  })
  
  // Reset all broken streaks
  const updatePromises = brokenStreaks.map(streak =>
    prisma.streak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 0
      }
    })
  )
  
  await Promise.all(updatePromises)
  
  return brokenStreaks.length
}

/**
 * Get user's current streak info
 * 
 * @param userId - The user's ID
 * @returns Streak information
 */
export async function getStreakInfo(userId: string) {
  const streak = await prisma.streak.findUnique({
    where: { userId }
  })
  
  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      isActiveToday: false
    }
  }
  
  const today = getTodayStart()
  const lastActivity = streak.lastActivityDate
  let isActiveToday = false
  
  if (lastActivity) {
    const lastDate = new Date(lastActivity)
    lastDate.setHours(0, 0, 0, 0)
    isActiveToday = lastDate.getTime() === today.getTime()
  }
  
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActivityDate: streak.lastActivityDate,
    isActiveToday
  }
}
