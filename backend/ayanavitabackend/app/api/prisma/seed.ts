import { PrismaClient, SpecialistLevel } from '@prisma/client'
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
  const passwordHash = await bcrypt.hash('123456', 10)

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

  const seedCourses = [
    { title: 'Course 1 - Basic', price: 99000 },
    { title: 'Course 2 - Pro', price: 199000 },
    { title: 'Course 3 - Master', price: 299000 },
  ].map((c) => ({ ...c, slug: slugify(c.title) }))

  await prisma.course.createMany({ data: seedCourses, skipDuplicates: true })

  const branchSeeds = [
    { code: 'HCM_Q1', name: 'AYANAVITA • Quận 1 (HCM)', address: '12 Nguyễn Huệ, Quận 1, TP.HCM', phone: '0900000001' },
    { code: 'HN_CG', name: 'AYANAVITA • Cầu Giấy (HN)', address: '88 Trần Thái Tông, Cầu Giấy, Hà Nội', phone: '0900000002' },
    { code: 'DN_HC', name: 'AYANAVITA • Hải Châu (ĐN)', address: '25 Bạch Đằng, Hải Châu, Đà Nẵng', phone: '0900000003' },
  ]

  const serviceSeeds = [
    {
      code: 'SV-01',
      name: 'Chăm sóc da chuyên sâu 👏',
      category: 'skin',
      goals: ['restore', 'bright'],
      suitableFor: ['Da xỉn màu', 'Da thiếu ẩm'],
      durationMin: 75,
      price: 590000,
      ratingAvg: 4.9,
      bookedCount: 1320,
      tag: 'Best seller',
      imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=70',
      description: 'Liệu trình làm sạch và phục hồi da chuyên sâu.',
    },
    {
      code: 'SV-03',
      name: 'Massage thư giãn toàn thân 🤗',
      category: 'body',
      goals: ['relax'],
      suitableFor: ['Người stress', 'Mất ngủ'],
      durationMin: 60,
      price: 450000,
      ratingAvg: 4.7,
      bookedCount: 1640,
      tag: 'Relax',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=70',
      description: 'Massage toàn thân giúp thư giãn và giảm căng cơ.',
    },
    {
      code: 'SV-04',
      name: 'Gội đầu dưỡng sinh 🌿',
      category: 'health',
      goals: ['relax', 'pain'],
      suitableFor: ['Dân văn phòng', 'Hay đau đầu'],
      durationMin: 60,
      price: 320000,
      ratingAvg: 4.8,
      bookedCount: 2100,
      tag: 'Hot',
      imageUrl: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?auto=format&fit=crop&w=1200&q=70',
      description: 'Kết hợp massage da đầu và tinh dầu giúp giảm căng thẳng.',
    },
    {
      code: 'SV-06',
      name: 'Combo da + massage ✨',
      category: 'package',
      goals: ['restore', 'relax'],
      suitableFor: ['Cần phục hồi toàn diện', 'Thiếu thời gian'],
      durationMin: 120,
      price: 1050000,
      ratingAvg: 4.9,
      bookedCount: 420,
      tag: 'Combo',
      imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=70',
      description: 'Kết hợp chăm sóc da và massage trị liệu trong một buổi.',
    },
  ]

  const specialistSeeds: Array<{ code: string; name: string; level: SpecialistLevel; bio: string }> = [
    { code: 'LINH', name: 'Chuyên viên Linh', level: SpecialistLevel.SENIOR, bio: '8 năm kinh nghiệm chăm sóc da.' },
    { code: 'TRANG', name: 'Chuyên viên Trang', level: SpecialistLevel.EXPERT, bio: 'Chuyên gia massage trị liệu.' },
    { code: 'MAI', name: 'Chuyên viên Mai', level: SpecialistLevel.SENIOR, bio: 'Tư vấn liệu trình phục hồi da.' },
    { code: 'NAM', name: 'Chuyên viên Nam', level: SpecialistLevel.THERAPIST, bio: 'Kỹ thuật viên trị liệu cổ vai gáy.' },
  ]

  for (const b of branchSeeds) {
    await prisma.branch.upsert({ where: { code: b.code }, update: b, create: b })
  }

  for (const s of serviceSeeds) {
    await prisma.service.upsert({ where: { code: s.code }, update: s, create: s })
  }

  for (const st of specialistSeeds) {
    await prisma.specialist.upsert({ where: { code: st.code }, update: st, create: st })
  }

  const branches = await prisma.branch.findMany()
  const services = await prisma.service.findMany()
  const specialists = await prisma.specialist.findMany()

  for (const branch of branches) {
    for (const service of services) {
      await prisma.branchService.upsert({
        where: { branchId_serviceId: { branchId: branch.id, serviceId: service.id } },
        update: {},
        create: { branchId: branch.id, serviceId: service.id },
      })
    }

    for (const specialist of specialists) {
      await prisma.branchSpecialist.upsert({
        where: { branchId_specialistId: { branchId: branch.id, specialistId: specialist.id } },
        update: {},
        create: { branchId: branch.id, specialistId: specialist.id },
      })
    }
  }

  for (const specialist of specialists) {
    for (const service of services) {
      await prisma.serviceSpecialist.upsert({
        where: { serviceId_specialistId: { serviceId: service.id, specialistId: specialist.id } },
        update: {},
        create: { serviceId: service.id, specialistId: specialist.id },
      })
    }
  }

  const now = new Date()
  const sampleAppointments = [
    {
      code: 'APM-1001',
      customerName: 'Nguyễn Thu Hà',
      customerPhone: '0912000111',
      customerEmail: 'thuha@example.com',
      appointmentAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      note: 'Da nhạy cảm, cần tư vấn kỹ.',
      branchId: branches[0]?.id,
      serviceId: services[0]?.id,
      specialistId: specialists[0]?.id,
      userId: user.id,
    },
    {
      code: 'APM-1002',
      customerName: 'Trần Minh Anh',
      customerPhone: '0912000222',
      customerEmail: 'minhanh@example.com',
      appointmentAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      note: 'Ưu tiên khung giờ chiều 🤗',
      branchId: branches[1]?.id,
      serviceId: services[1]?.id,
      specialistId: specialists[1]?.id,
      userId: user.id,
    },
  ].filter((item) => item.branchId && item.serviceId)

  for (const a of sampleAppointments) {
    await prisma.appointment.upsert({
      where: { code: a.code },
      update: a,
      create: a,
    })
  }

  const serviceReviewSeeds = [
    { serviceId: services[0]?.id, userId: user.id, stars: 5, comment: 'Rất hài lòng 👏👏👏', customerName: 'Thu Hà' },
    { serviceId: services[1]?.id, userId: user.id, stars: 4, comment: 'Dịch vụ tốt, nhân viên nhiệt tình 🤗', customerName: 'Minh Anh' },
    { serviceId: services[2]?.id, userId: null, stars: 5, comment: 'Thư giãn đúng nghĩa, sẽ quay lại!', customerName: 'Khách lẻ' },
  ].filter((r) => r.serviceId)

  for (const review of serviceReviewSeeds) {
    const existing = await prisma.serviceReview.findFirst({
      where: {
        serviceId: review.serviceId,
        customerName: review.customerName ?? undefined,
        comment: review.comment ?? undefined,
      },
    })

    if (!existing) {
      await prisma.serviceReview.create({ data: review })
    }
  }

  const courses = await prisma.course.findMany({ orderBy: { id: 'asc' } })
  console.log('🌱 Seed OK')
  console.log({ userId: user.id, coursesCount: courses.length, branches: branches.length, services: services.length, specialists: specialists.length })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
