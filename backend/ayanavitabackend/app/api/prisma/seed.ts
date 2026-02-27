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

async function seedCatalog() {
  await prisma.language.upsert({ where: { code: 'vi' }, update: { name: 'Tiếng Việt' }, create: { code: 'vi', name: 'Tiếng Việt' } })
  await prisma.language.upsert({ where: { code: 'en' }, update: { name: 'English' }, create: { code: 'en', name: 'English' } })
  await prisma.language.upsert({ where: { code: 'de' }, update: { name: 'Deutsch' }, create: { code: 'de', name: 'Deutsch' } })

  let skincare = await prisma.category.findFirst({
    where: { translations: { some: { languageCode: 'vi', slug: 'cham-soc-da' } } },
  })

  if (!skincare) {
    skincare = await prisma.category.create({
      data: {
        status: 'active',
        translations: {
          create: [
            { languageCode: 'vi', name: 'Chăm sóc da', slug: 'cham-soc-da', description: 'Danh mục sản phẩm skincare.' },
            { languageCode: 'en', name: 'Skincare', slug: 'skincare', description: 'Skincare product category.' },
            { languageCode: 'de', name: 'Hautpflege', slug: 'hautpflege', description: 'Kategorie für Hautpflegeprodukte.' },
          ],
        },
      },
    })
  }

  const [materialKey, volumeKey] = await Promise.all([
    prisma.attributeKey.upsert({
      where: { code: 'material' },
      update: {},
      create: {
        code: 'material',
        valueType: 'text',
        translations: {
          create: [
            { languageCode: 'vi', displayName: 'Chất liệu', description: 'Thành phần chất liệu chính' },
            { languageCode: 'en', displayName: 'Material', description: 'Main material information' },
            { languageCode: 'de', displayName: 'Material', description: 'Hauptmaterial-Information' },
          ],
        },
      },
    }),
    prisma.attributeKey.upsert({
      where: { code: 'volume_ml' },
      update: {},
      create: {
        code: 'volume_ml',
        valueType: 'number',
        translations: {
          create: [
            { languageCode: 'vi', displayName: 'Dung tích (ml)' },
            { languageCode: 'en', displayName: 'Volume (ml)' },
            { languageCode: 'de', displayName: 'Volumen (ml)' },
          ],
        },
      },
    }),
  ])

  const [vitaminCKey, aloeKey] = await Promise.all([
    prisma.ingredientKey.upsert({
      where: { code: 'vitamin_c' },
      update: {},
      create: {
        code: 'vitamin_c',
        translations: {
          create: [
            { languageCode: 'vi', displayName: 'Vitamin C' },
            { languageCode: 'en', displayName: 'Vitamin C' },
            { languageCode: 'de', displayName: 'Vitamin C' },
          ],
        },
      },
    }),
    prisma.ingredientKey.upsert({
      where: { code: 'aloe_vera' },
      update: {},
      create: {
        code: 'aloe_vera',
        translations: {
          create: [
            { languageCode: 'vi', displayName: 'Nha đam' },
            { languageCode: 'en', displayName: 'Aloe Vera' },
            { languageCode: 'de', displayName: 'Aloe Vera' },
          ],
        },
      },
    }),
  ])

  const sku = 'SPA-SERUM-001'
  const product = await prisma.catalogProduct.upsert({
    where: { sku },
    update: {
      categoryId: skincare.id,
      price: 489000,
      status: 'active',
    },
    create: {
      sku,
      categoryId: skincare.id,
      price: 489000,
      status: 'active',
      translations: {
        create: [
          {
            languageCode: 'vi',
            name: 'Serum Spa Phục Hồi',
            slug: slugify('serum-spa-phuc-hoi'),
            shortDescription: 'Dưỡng sáng và làm dịu da sau liệu trình spa.',
            description: 'Serum giàu vitamin C và nha đam, phù hợp dùng hằng ngày.',
          },
          {
            languageCode: 'en',
            name: 'Spa Recovery Serum',
            slug: slugify('spa-recovery-serum'),
            shortDescription: 'Brightens and calms skin after spa treatment.',
            description: 'A daily serum with vitamin C and aloe vera.',
          },
          {
            languageCode: 'de',
            name: 'Spa Regenerationsserum',
            slug: slugify('spa-regenerationsserum'),
            shortDescription: 'Für strahlende und beruhigte Haut nach Spa-Behandlung.',
            description: 'Tägliches Serum mit Vitamin C und Aloe Vera.',
          },
        ],
      },
    },
  })

  await prisma.productAttribute.upsert({
    where: { productId_attributeKeyId: { productId: product.id, attributeKeyId: materialKey.id } },
    update: { valueText: 'Glass bottle' },
    create: { productId: product.id, attributeKeyId: materialKey.id, valueText: 'Glass bottle' },
  })

  await prisma.productAttribute.upsert({
    where: { productId_attributeKeyId: { productId: product.id, attributeKeyId: volumeKey.id } },
    update: { valueNumber: 30 },
    create: { productId: product.id, attributeKeyId: volumeKey.id, valueNumber: 30 },
  })

  await prisma.productIngredient.upsert({
    where: { productId_ingredientKeyId: { productId: product.id, ingredientKeyId: vitaminCKey.id } },
    update: { value: '10mg', sortOrder: 1 },
    create: { productId: product.id, ingredientKeyId: vitaminCKey.id, value: '10mg', sortOrder: 1 },
  })

  await prisma.productIngredient.upsert({
    where: { productId_ingredientKeyId: { productId: product.id, ingredientKeyId: aloeKey.id } },
    update: { value: '5%', sortOrder: 2 },
    create: { productId: product.id, ingredientKeyId: aloeKey.id, value: '5%', sortOrder: 2 },
  })
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
  const branchSeeds = [
    { code: 'HCM_Q1', name: 'AYANAVITA • Quận 1 (HCM)', address: '12 Nguyễn Huệ, Quận 1, TP.HCM', phone: '0900000001' },
    { code: 'HN_CG', name: 'AYANAVITA • Cầu Giấy (HN)', address: '88 Trần Thái Tông, Cầu Giấy, Hà Nội', phone: '0900000002' },
    { code: 'DN_HC', name: 'AYANAVITA • Hải Châu (ĐN)', address: '25 Bạch Đằng, Hải Châu, Đà Nẵng', phone: '0900000003' },
  ]

  const serviceSeeds = [
    {
      name: 'Chăm sóc da chuyên sâu 👏',
      categoryName: 'Chăm sóc da',
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
      name: 'Massage thư giãn toàn thân 🤗',
      categoryName: 'Chăm sóc cơ thể',
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
      name: 'Gội đầu dưỡng sinh 🌿',
      categoryName: 'Dưỡng sinh',
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
      name: 'Combo da + massage ✨',
      categoryName: 'Combo liệu trình',
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

  const specialistSeeds: Array<{ email: string; name: string; level: SpecialistLevel; bio: string; branchCode: string }> = [
    { email: 'linh.staff@ayanavita.local', name: 'Chuyên viên Linh', level: SpecialistLevel.SENIOR, bio: '8 năm kinh nghiệm chăm sóc da.', branchCode: 'HCM_Q1' },
    { email: 'trang.staff@ayanavita.local', name: 'Chuyên viên Trang', level: SpecialistLevel.EXPERT, bio: 'Chuyên gia massage trị liệu.', branchCode: 'HN_CG' },
    { email: 'mai.staff@ayanavita.local', name: 'Chuyên viên Mai', level: SpecialistLevel.SENIOR, bio: 'Tư vấn liệu trình phục hồi da.', branchCode: 'DN_HC' },
    { email: 'nam.staff@ayanavita.local', name: 'Chuyên viên Nam', level: SpecialistLevel.THERAPIST, bio: 'Kỹ thuật viên trị liệu cổ vai gáy.', branchCode: 'HCM_Q1' },
  ]

  for (const b of branchSeeds) {
    await prisma.branch.upsert({ where: { code: b.code }, update: b, create: b })
  }

  const categorySeeds = [
    { name: 'Chăm sóc da' },
    { name: 'Chăm sóc cơ thể' },
    { name: 'Dưỡng sinh' },
    { name: 'Combo liệu trình' },
    { name: 'Khác' },
  ]

  for (const c of categorySeeds) {
    await prisma.serviceCategory.upsert({ where: { name: c.name }, update: c, create: c })
  }

  const categories = await prisma.serviceCategory.findMany()
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]))

  for (const s of serviceSeeds) {
    const { categoryName, ...serviceData } = s
    const categoryId = categoryMap.get(categoryName) ?? categoryMap.get('Khác')
    const existingService = await prisma.service.findFirst({ where: { name: s.name } })
    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: { ...serviceData, categoryId },
      })
    } else {
      await prisma.service.create({ data: { ...serviceData, categoryId } })
    }
  }

  const branches = await prisma.branch.findMany()
  const branchByCode = new Map(branches.map((item) => [item.code, item.id]))

  for (const st of specialistSeeds) {
    const branchId = branchByCode.get(st.branchCode)
    if (!branchId) continue
    const specialistData = (({ email, branchCode, ...rest }) => rest)(st)

    const staffUser = await prisma.user.upsert({
      where: { email: st.email },
      update: { name: st.name, role: 'STAFF' },
      create: {
        email: st.email,
        password: passwordHash,
        name: st.name,
        role: 'STAFF',
      },
    })

    const existingSpecialist = await prisma.specialist.findUnique({ where: { userId: staffUser.id } })
    if (existingSpecialist) {
      await prisma.specialist.update({
        where: { id: existingSpecialist.id },
        data: {
          ...specialistData,
          branch: { connect: { id: branchId } },
        },
      })
    } else {
      await prisma.specialist.create({
        data: {
          ...specialistData,
          branch: { connect: { id: branchId } },
          user: { connect: { id: staffUser.id } },
        },
      })
    }
  }

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
  }

  for (const specialist of specialists) {
    const branchServices = services.filter((_, index) => index % 2 === specialist.id % 2)
    const allowedServices = branchServices.length > 0 ? branchServices : services.slice(0, 1)

    for (const service of allowedServices) {
      await prisma.specialistBranchService.upsert({
        where: {
          specialistId_branchId_serviceId: {
            specialistId: specialist.id,
            branchId: specialist.branchId,
            serviceId: service.id,
          },
        },
        update: {},
        create: {
          specialistId: specialist.id,
          branchId: specialist.branchId,
          serviceId: service.id,
        },
      })
    }
  }



  const branchTranslations = [
    { code: 'HCM_Q1', locale: 'en-US', name: 'AYANAVITA • District 1 (HCMC)', address: '12 Nguyen Hue, District 1, Ho Chi Minh City' },
    { code: 'HCM_Q1', locale: 'de', name: 'AYANAVITA • Bezirk 1 (HCMC)', address: '12 Nguyen Hue, Bezirk 1, Ho-Chi-Minh-Stadt' },
    { code: 'HN_CG', locale: 'en-US', name: 'AYANAVITA • Cau Giay (Hanoi)', address: '88 Tran Thai Tong, Cau Giay, Hanoi' },
    { code: 'HN_CG', locale: 'de', name: 'AYANAVITA • Cau Giay (Hanoi)', address: '88 Tran Thai Tong, Cau Giay, Hanoi' },
    { code: 'DN_HC', locale: 'en-US', name: 'AYANAVITA • Hai Chau (Da Nang)', address: '25 Bach Dang, Hai Chau, Da Nang' },
    { code: 'DN_HC', locale: 'de', name: 'AYANAVITA • Hai Chau (Da Nang)', address: '25 Bach Dang, Hai Chau, Da Nang' },
  ] as const

  for (const row of branchTranslations) {
    const branchId = branchByCode.get(row.code)
    if (!branchId) continue
    await prisma.branchTranslation.upsert({
      where: { branchId_locale: { branchId, locale: row.locale } },
      update: { name: row.name, address: row.address },
      create: { branchId, locale: row.locale, name: row.name, address: row.address },
    })
  }

  const categoriesWithId = await prisma.serviceCategory.findMany({ select: { id: true, name: true } })
  const categoryByName = new Map(categoriesWithId.map((c) => [c.name, c.id]))
  const categoryTranslations = [
    { name: 'Chăm sóc da', locale: 'en-US', value: 'Skin care' },
    { name: 'Chăm sóc da', locale: 'de', value: 'Hautpflege' },
    { name: 'Chăm sóc cơ thể', locale: 'en-US', value: 'Body care' },
    { name: 'Chăm sóc cơ thể', locale: 'de', value: 'Körperpflege' },
    { name: 'Dưỡng sinh', locale: 'en-US', value: 'Wellness therapy' },
    { name: 'Dưỡng sinh', locale: 'de', value: 'Wellness-Therapie' },
    { name: 'Combo liệu trình', locale: 'en-US', value: 'Treatment combo' },
    { name: 'Combo liệu trình', locale: 'de', value: 'Behandlungskombination' },
  ] as const

  for (const row of categoryTranslations) {
    const categoryId = categoryByName.get(row.name)
    if (!categoryId) continue
    await prisma.serviceCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId, locale: row.locale } },
      update: { name: row.value },
      create: { categoryId, locale: row.locale, name: row.value },
    })
  }

  const serviceTranslationSeeds = [
    {
      sourceName: 'Chăm sóc da chuyên sâu 👏',
      locale: 'en-US',
      name: 'Deep skin treatment',
      description: 'Deep cleansing and skin recovery therapy.',
      goals: ['restore', 'bright'],
      suitableFor: ['Dull skin', 'Dry skin'],
      process: ['Skin analysis', 'Deep cleansing', 'Recovery mask'],
      tag: 'Best seller',
    },
    {
      sourceName: 'Chăm sóc da chuyên sâu 👏',
      locale: 'de',
      name: 'Intensive Hautpflege',
      description: 'Intensive Reinigung und Regeneration der Haut.',
      goals: ['Regeneration', 'Aufhellung'],
      suitableFor: ['Fahle Haut', 'Trockene Haut'],
      process: ['Hautanalyse', 'Tiefenreinigung', 'Regenerationsmaske'],
      tag: 'Bestseller',
    },
    {
      sourceName: 'Massage thư giãn toàn thân 🤗',
      locale: 'en-US',
      name: 'Full body relaxing massage',
      description: 'Massage to relax body and reduce muscle tension.',
      goals: ['relax'],
      suitableFor: ['Stress', 'Insomnia'],
      process: ['Warm-up', 'Deep pressure massage', 'Recovery stretch'],
      tag: 'Relax',
    },
    {
      sourceName: 'Massage thư giãn toàn thân 🤗',
      locale: 'de',
      name: 'Ganzkörper-Entspannungsmassage',
      description: 'Massage zur Entspannung und Muskelentlastung.',
      goals: ['Entspannung'],
      suitableFor: ['Stress', 'Schlafprobleme'],
      process: ['Aufwärmen', 'Tiefenmassage', 'Dehnung'],
      tag: 'Relax',
    },
  ] as const

  const servicesByName = await prisma.service.findMany({ select: { id: true, name: true } })
  const serviceByName = new Map(servicesByName.map((item) => [item.name, item.id]))
  for (const row of serviceTranslationSeeds) {
    const serviceId = serviceByName.get(row.sourceName)
    if (!serviceId) continue
    await prisma.serviceTranslation.upsert({
      where: { serviceId_locale: { serviceId, locale: row.locale } },
      update: { name: row.name, description: row.description, goals: row.goals, suitableFor: row.suitableFor, process: row.process, tag: row.tag },
      create: { serviceId, locale: row.locale, name: row.name, description: row.description, goals: row.goals, suitableFor: row.suitableFor, process: row.process, tag: row.tag },
    })
  }

  const specialistsForTranslation = await prisma.specialist.findMany({ select: { id: true, name: true } })
  for (const specialist of specialistsForTranslation) {
    await prisma.specialistTranslation.upsert({
      where: { specialistId_locale: { specialistId: specialist.id, locale: 'en-US' } },
      update: { name: specialist.name.replace('Chuyên viên', 'Specialist'), bio: 'Experienced specialist at AYANAVITA.' },
      create: { specialistId: specialist.id, locale: 'en-US', name: specialist.name.replace('Chuyên viên', 'Specialist'), bio: 'Experienced specialist at AYANAVITA.' },
    })
    await prisma.specialistTranslation.upsert({
      where: { specialistId_locale: { specialistId: specialist.id, locale: 'de' } },
      update: { name: specialist.name.replace('Chuyên viên', 'Spezialist'), bio: 'Erfahrener Spezialist bei AYANAVITA.' },
      create: { specialistId: specialist.id, locale: 'de', name: specialist.name.replace('Chuyên viên', 'Spezialist'), bio: 'Erfahrener Spezialist bei AYANAVITA.' },
    })
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
