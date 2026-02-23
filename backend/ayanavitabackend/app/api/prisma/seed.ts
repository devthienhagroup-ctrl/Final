import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function main() {
  // 🔐 HASH PASSWORD
  const passwordHash = await bcrypt.hash('123456', 10)

  // 👤 USER TEST (CHỈ 1 LẦN – PASSWORD ĐÃ HASH)
  const user = await prisma.user.upsert({
    where: { email: 'test@ayanavita.com' },
    update: {},
    create: {
      email: 'test@ayanavita.com',
      password: passwordHash,
      name: 'Test User',
      role: 'USER',
    },
  })

  // 📚 COURSES TEST
  const seedCourses = [
    { title: 'Course 1 - Basic', price: 99000 },
    { title: 'Course 2 - Pro', price: 199000 },
    { title: 'Course 3 - Master', price: 299000 },
  ].map((c) => ({
    ...c,
    slug: slugify(c.title),
  }))

  await prisma.course.createMany({
    data: seedCourses,
    skipDuplicates: true,
  })

  const courses = await prisma.course.findMany({ orderBy: { id: 'asc' } })

  console.log('🌱 Seed OK')
  console.log({ userId: user.id, courses })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
