import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseAccessStatus, Prisma, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type JwtUser = { sub: number; role: UserRole | string }

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveLocale(lang?: string) {
    const normalized = (lang || 'vi').toLowerCase()
    if (normalized === 'en' || normalized === 'de') return normalized
    return 'vi'
  }

  async myEnrollments(userId: number, status?: CourseAccessStatus | 'ALL') {
    const where: Prisma.CourseAccessWhereInput = {
      userId,
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    return this.prisma.courseAccess.findMany({
      where,
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        grantedAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            price: true,
            published: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })
  }

  async grantAccess(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) throw new NotFoundException('Course not found')

    return this.prisma.courseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: CourseAccessStatus.ACTIVE, grantedAt: new Date() },
      create: { userId, courseId, status: CourseAccessStatus.ACTIVE },
      select: { id: true, userId: true, courseId: true, status: true, grantedAt: true, updatedAt: true },
    })
  }

  myCourses(userId: number, lang?: string) {
    const locale = this.resolveLocale(lang)

    return this.prisma.courseAccess.findMany({
      where: { userId, status: CourseAccessStatus.ACTIVE },
      select: {
        id: true,
        courseId: true,
        status: true,
        grantedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            translations: {
              where: { locale: { in: [locale, 'vi'] } },
              select: {
                locale: true,
                title: true,
                description: true,
              },
            },
            slug: true,
            description: true,
            thumbnail: true,
            price: true,
            published: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    })
  }

  async myCoursesWithProgress(user: JwtUser, lang?: string) {
    const userId = user.sub
    const isAdmin = user.role === 'ADMIN'
    const locale = this.resolveLocale(lang)
    const accesses = await this.myCourses(userId, locale)

    if (accesses.length === 0) return []

    const completed = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        ...(isAdmin ? {} : { lesson: { published: true } }),
      },
      select: {
        lesson: { select: { courseId: true } },
      },
    })

    const completedCountByCourse = new Map<number, number>()
    for (const x of completed) {
      const courseId = x.lesson.courseId
      completedCountByCourse.set(courseId, (completedCountByCourse.get(courseId) || 0) + 1)
    }

    const courseIds = accesses.map((e) => e.course.id)
    const totals = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
        ...(isAdmin ? {} : { published: true }),
      },
      _count: { _all: true },
    })
    const totalByCourse = new Map<number, number>(totals.map((t) => [t.courseId, t._count._all]))

    return accesses.map((e) => {
      const totalLessons = totalByCourse.get(e.course.id) || 0
      const completedLessons = completedCountByCourse.get(e.course.id) || 0
      const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

      return {
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        grantedAt: e.grantedAt,
        course: {
          ...e.course,
          title:
            (e.course as any).translations?.find((item: any) => item.locale === locale)?.title ||
            (e.course as any).translations?.find((item: any) => item.locale === 'vi')?.title ||
            e.course.title,
          description:
            (e.course as any).translations?.find((item: any) => item.locale === locale)?.description ||
            (e.course as any).translations?.find((item: any) => item.locale === 'vi')?.description ||
            e.course.description,
        },
        progress: { totalLessons, completedLessons, percent },
      }
    })
  }

  async cancel(userId: number, courseId: number) {
    const access = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true },
    })
    if (!access) throw new NotFoundException('Course access not found')

    return this.prisma.courseAccess.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: CourseAccessStatus.CANCELED },
      select: { id: true, status: true, updatedAt: true },
    })
  }

  async assertEnrolledOrAdmin(user: JwtUser, courseId: number) {
    if (user.role === 'ADMIN') return

    const e = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId: user.sub, courseId } },
      select: { status: true },
    })

    if (!e || e.status !== CourseAccessStatus.ACTIVE) throw new ForbiddenException('Not enrolled')
  }
}
