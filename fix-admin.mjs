import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const hashedPassword = await bcrypt.hash('admin123', 10)

const user = await prisma.user.upsert({
  where: { email: 'admin@lms.com' },
  update: {},
  create: {
    name: 'Admin User',
    email: 'admin@lms.com',
    hashedPassword,
    role: 'ADMIN',
    isActive: true,
    emailVerified: new Date(),
  }
})

console.log('Done! Created:', user.email, '| Role:', user.role)
await prisma.$disconnect()