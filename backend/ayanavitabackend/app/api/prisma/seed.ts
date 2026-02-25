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

  const seedCourses = [
    { title: 'Course 1 - Basic', price: 99000 },
    { title: 'Course 2 - Pro', price: 199000 },
    { title: 'Course 3 - Master', price: 299000 },
  ].map((c) => ({ ...c, slug: slugify(c.title) }))

  await prisma.course.createMany({ data: seedCourses, skipDuplicates: true })
  await seedCatalog()

  const courses = await prisma.course.findMany({ orderBy: { id: 'asc' } })
  console.log('🌱 Seed OK')
  console.log({ userId: user.id, coursesCount: courses.length })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
