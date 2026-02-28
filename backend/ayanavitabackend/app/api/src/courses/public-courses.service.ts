import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type Locale = 'vi' | 'en' | 'de'

@Injectable()
export class PublicCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveLocale(lang?: string): Locale {
    const normalized = (lang || 'vi').toLowerCase()
    if (normalized.startsWith('en')) return 'en'
    if (normalized.startsWith('de')) return 'de'
    return 'vi'
  }

  async detailBySlug(slug: string, lang?: string) {
    const locale = this.resolveLocale(lang)
    const course = await this.prisma.course.findFirst({
      where: { slug, published: true },
      include: {
        translations: {
          where: { locale: { in: [locale, 'vi'] } },
          select: {
            locale: true,
            title: true,
            shortDescription: true,
            description: true,
            objectives: true,
            targetAudience: true,
            benefits: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
            translations: {
              where: { locale: { in: [locale, 'vi'] } },
              select: { locale: true, name: true },
            },
          },
        },
        lessons: {
          where: { published: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            order: true,
            translations: {
              where: { locale: { in: [locale, 'vi'] } },
              select: { locale: true, title: true },
            },
            modules: {
              where: { published: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                translations: {
                  where: { locale: { in: [locale, 'vi'] } },
                  select: { locale: true, title: true },
                },
              },
            },
          },
        },
        courseReviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            stars: true,
            comment: true,
            customerName: true,
            createdAt: true,
          },
        },
      },
    })

    if (!course) throw new NotFoundException('Course not found')

    const courseTr =
      course.translations.find((item) => item.locale === locale) ||
      course.translations.find((item) => item.locale === 'vi')

    return {
      id: course.id,
      slug: course.slug,
      title: courseTr?.title || course.title,
      shortDescription: courseTr?.shortDescription || course.shortDescription,
      description: courseTr?.description || course.description,
      time: course.time,
      thumbnail: course.thumbnail,
      price: course.price,
      ratingAvg: course.ratingAvg,
      ratingCount: course.ratingCount,
      enrollmentCount: course.enrollmentCount,
      topic: course.topic
        ? {
            id: course.topic.id,
            name:
              course.topic.translations.find((item) => item.locale === locale)?.name ||
              course.topic.translations.find((item) => item.locale === 'vi')?.name ||
              course.topic.name,
          }
        : null,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        order: lesson.order,
        title:
          lesson.translations.find((item) => item.locale === locale)?.title ||
          lesson.translations.find((item) => item.locale === 'vi')?.title ||
          lesson.title,
        modules: lesson.modules.map((module) => ({
          id: module.id,
          order: module.order,
          title:
            module.translations.find((item) => item.locale === locale)?.title ||
            module.translations.find((item) => item.locale === 'vi')?.title ||
            module.title,
        })),
      })),
      reviews: course.courseReviews,
    }
  }
}
