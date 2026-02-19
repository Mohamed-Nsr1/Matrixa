/**
 * Database Seed Script
 * 
 * Creates initial data for the Matrixa application:
 * - Admin user
 * - Branches (Scientific/Literary)
 * - System settings
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create system settings
  console.log('Creating system settings...')
  // Calculate default exam date (next June 15th)
  const now = new Date()
  const currentYear = now.getFullYear()
  let examDate = new Date(currentYear, 5, 15) // June 15th
  if (examDate <= now) {
    examDate = new Date(currentYear + 1, 5, 15)
  }
  const examDateStr = examDate.toISOString().split('T')[0] // YYYY-MM-DD format

  const settings = [
    { key: 'inviteOnlyMode', value: 'false', description: 'Whether registration requires invite code' },
    { key: 'subscriptionEnabled', value: 'true', description: 'Whether subscriptions are required' },
    { key: 'trialEnabled', value: 'true', description: 'Whether free trial is enabled' },
    { key: 'trialDays', value: '14', description: 'Length of trial period in days' },
    { key: 'leaderboardEnabled', value: 'true', description: 'Whether leaderboard is visible' },
    { key: 'testMode', value: 'true', description: 'Whether payment is in test mode' },
    { key: 'examDate', value: examDateStr, description: 'Start date of Thanaweya Amma exams' }
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value, description: setting.description }
    })
  }

  // Create branches
  console.log('Creating branches...')
  const scientificBranch = await prisma.branch.upsert({
    where: { code: 'scientific' },
    create: {
      code: 'scientific',
      nameAr: 'علمي',
      nameEn: 'Scientific',
      description: 'Scientific branch with math and science subjects',
      order: 0,
      isActive: true
    },
    update: {}
  })

  const literaryBranch = await prisma.branch.upsert({
    where: { code: 'literary' },
    create: {
      code: 'literary',
      nameAr: 'أدبي',
      nameEn: 'Literary',
      description: 'Literary branch with humanities subjects',
      order: 1,
      isActive: true
    },
    update: {}
  })

  // Create admin user
  console.log('Creating admin user...')
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@matrixa.com' },
    create: {
      email: 'admin@matrixa.com',
      passwordHash,
      role: 'ADMIN',
      fullName: 'Admin User',
      uiLanguage: 'arabic',
      onboardingCompleted: true
    },
    update: {
      passwordHash
    }
  })

  // Create some sample invite codes
  console.log('Creating sample invite codes...')
  await prisma.inviteCode.upsert({
    where: { code: 'WELCOME2024' },
    create: {
      code: 'WELCOME2024',
      maxUses: 100,
      currentUses: 0,
      isActive: true
    },
    update: {}
  })

  // Create a subscription plan
  console.log('Creating subscription plan...')
  await prisma.subscriptionPlan.upsert({
    where: { id: 'default-plan' },
    create: {
      id: 'default-plan',
      name: 'Monthly Premium',
      nameAr: 'الاشتراك الشهري',
      description: 'Full access to all features',
      descriptionAr: 'وصول كامل لجميع المميزات',
      price: 99,
      durationDays: 30,
      features: JSON.stringify(['unlimited_tasks', 'focus_mode', 'notes', 'analytics', 'private_lessons']),
      isActive: true
    },
    update: {}
  })

  console.log('Seed completed!')
  console.log({
    adminEmail: adminUser.email,
    adminPassword: '(from env ADMIN_PASSWORD or default)',
    branches: [scientificBranch.nameAr, literaryBranch.nameAr]
  })
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
