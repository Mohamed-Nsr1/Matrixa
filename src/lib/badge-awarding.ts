/**
 * Badge Awarding Service
 * 
 * Handles automatic badge earning based on user achievements
 */

import { prisma } from './db'

interface UserStats {
  currentStreak: number
  tasksCompleted: number
  focusSessions: number
  studyMinutes: number
  subjectsCompleted: number
}

async function getUserStats(userId: string): Promise<UserStats> {
  const streak = await prisma.streak.findUnique({
    where: { userId }
  })

  const leaderboard = await prisma.leaderboardEntry.findUnique({
    where: { userId }
  })

  // Count completed tasks
  const completedTasks = await prisma.task.count({
    where: {
      userId,
      status: 'COMPLETED'
    }
  })

  // Count focus sessions
  const focusSessions = await prisma.focusSession.count({
    where: {
      userId,
      wasCompleted: true
    }
  })

  // Count completed subjects (all lessons done)
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          unit: {
            include: {
              subject: {
                include: {
                  units: {
                    include: {
                      lessons: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Calculate subjects completed (all lessons in subject have all 3 markers done)
  const subjectProgress = new Map<string, { total: number; completed: number }>()
  
  for (const lp of lessonProgress) {
    const subjectId = lp.lesson?.unit?.subjectId
    if (subjectId) {
      const current = subjectProgress.get(subjectId) || { total: 0, completed: 0 }
      current.total += 3 // video + questions + revision
      if (lp.doneVideo) current.completed++
      if (lp.doneQuestions) current.completed++
      if (lp.doneRevision) current.completed++
      subjectProgress.set(subjectId, current)
    }
  }

  let subjectsCompleted = 0
  for (const [, data] of subjectProgress) {
    if (data.total > 0 && data.completed >= data.total) {
      subjectsCompleted++
    }
  }

  return {
    currentStreak: streak?.currentStreak || 0,
    tasksCompleted: completedTasks,
    focusSessions: focusSessions,
    studyMinutes: leaderboard?.studyMinutes || 0,
    subjectsCompleted
  }
}

/**
 * Check and award badges to a user based on their current stats
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const userStats = await getUserStats(userId)
  const allBadges = await prisma.badge.findMany({
    where: { isActive: true }
  })

  const newlyAwardedBadges: string[] = []

  for (const badge of allBadges) {
    // Check if user already has this badge completed
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id
        }
      }
    })

    if (existingBadge?.isCompleted) continue

    let progress = 0
    let completed = false

    switch (badge.type) {
      case 'STREAK':
        progress = userStats.currentStreak
        completed = progress >= badge.requirement
        break
      case 'TASKS':
        progress = userStats.tasksCompleted
        completed = progress >= badge.requirement
        break
      case 'FOCUS':
        progress = userStats.focusSessions
        completed = progress >= badge.requirement
        break
      case 'SUBJECTS':
        progress = userStats.subjectsCompleted
        completed = progress >= badge.requirement
        break
      case 'SPECIAL':
        // Special badges are manually awarded
        continue
    }

    if (completed && !existingBadge) {
      // Award new badge
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          progress,
          isCompleted: true
        }
      })

      // Award XP to leaderboard
      await prisma.leaderboardEntry.update({
        where: { userId },
        data: {
          score: { increment: badge.xpReward }
        }
      })

      newlyAwardedBadges.push(badge.nameAr)
    } else if (existingBadge && !existingBadge.isCompleted) {
      // Update progress
      await prisma.userBadge.update({
        where: { id: existingBadge.id },
        data: { progress }
      })
    }
  }

  return newlyAwardedBadges
}

/**
 * Get user's badges with progress
 */
export async function getUserBadges(userId: string) {
  const badges = await prisma.badge.findMany({
    where: { isActive: true },
    orderBy: [
      { rarity: 'asc' },
      { order: 'asc' }
    ],
    include: {
      userBadges: {
        where: { userId }
      }
    }
  })

  const userStats = await getUserStats(userId)

  return badges.map(badge => {
    const userBadge = badge.userBadges[0]
    let currentProgress = userBadge?.progress || 0

    // Calculate current progress based on badge type
    if (!userBadge) {
      switch (badge.type) {
        case 'STREAK':
          currentProgress = userStats.currentStreak
          break
        case 'TASKS':
          currentProgress = userStats.tasksCompleted
          break
        case 'FOCUS':
          currentProgress = userStats.focusSessions
          break
        case 'SUBJECTS':
          currentProgress = userStats.subjectsCompleted
          break
      }
    }

    return {
      id: badge.id,
      nameAr: badge.nameAr,
      nameEn: badge.nameEn,
      descriptionAr: badge.descriptionAr,
      descriptionEn: badge.descriptionEn,
      icon: badge.icon,
      color: badge.color,
      type: badge.type,
      requirement: badge.requirement,
      rarity: badge.rarity,
      xpReward: badge.xpReward,
      progress: currentProgress,
      isCompleted: userBadge?.isCompleted || false,
      earnedAt: userBadge?.earnedAt || null
    }
  })
}
