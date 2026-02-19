import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'student@matrixa.com' }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('User branchId:', user.branchId)
  
  // Update or create subscription
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id }
  })
  
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    console.log('Subscription updated to ACTIVE')
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    })
    console.log('Subscription created as ACTIVE')
  }
  
  // Set branch if missing
  if (!user.branchId) {
    const branch = await prisma.branch.findFirst()
    if (branch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { branchId: branch.id }
      })
      console.log('Set branch to:', branch.nameAr)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
