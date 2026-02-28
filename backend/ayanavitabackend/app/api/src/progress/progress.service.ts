import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ProgressStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { EnrollmentsService } from '../enrollments/enrollments.service'
import { UpsertProgressDto } from './dto/upsert-progress.dto'

type JwtUser = { sub: number; role: string }

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  private clampPercent(p?: number) {
    if (p === undefined) return undefined
    if (p < 0) return 0
    if (p > 100) return 100
    return p
  }

  private async getLessonOrThrow(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
        published: true,
        order: true,
        course: { select: { published: true } },
      },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    return lesson
  }

  /**
   * Sequential lock gate:
   * - ADMIN bypass
   * - USER: lesson i chỉ mở nếu lesson i-1 COMPLETED
   * - USER: chỉ xét lesson published=true
   */
  private async assertLessonUnlockedOrAdmin(user: JwtUser, lessonId: number, courseId: number) {
    if (user.role === 'ADMIN') return

    const orderedLessons = await this.prisma.lesson.findMany({
      where: { courseId, published: true },
      select: { id: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    const idx = orderedLessons.findIndex((l) => l.id === lessonId)
    if (idx === -1) throw new NotFoundException('Lesson not found')

    // lesson đầu tiên luôn mở
    if (idx === 0) return

    const prevLessonId = orderedLessons[idx - 1].id
    const prevProgress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.sub, lessonId: prevLessonId } },
      select: { status: true },
    })

    if (prevProgress?.status !== ProgressStatus.COMPLETED) {
      throw new ForbiddenException('Lesson locked')
    }
  }

  // POST /lessons/:id/progress  { percent?, lastPositionSec? }
  async upsertLessonProgress(user: JwtUser, lessonId: number, dto: UpsertProgressDto) {
    const lesson = await this.getLessonOrThrow(lessonId)

    // Gate enroll (ADMIN bypass)
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)

    // USER không truy cập course/lesson unpublished (ẩn 404)
    if (user.role !== 'ADMIN') {
      if (!lesson.course.published) throw new NotFoundException('Lesson not found')
      if (!lesson.published) throw new NotFoundException('Lesson not found')
    }

    // Gate lock (ADMIN bypass)
    await this.assertLessonUnlockedOrAdmin(user, lessonId, lesson.courseId)

    const percent = this.clampPercent(dto.percent)
    const lastPositionSec = dto.lastPositionSec
    const shouldComplete = percent !== undefined && percent >= 100

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.sub, lessonId } },

      create: {
        userId: user.sub,
        lessonId,
        status: shouldComplete ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        percent: percent ?? 0,
        lastPositionSec: lastPositionSec ?? 0,
        lastOpenedAt: new Date(),
        completedAt: shouldComplete ? new Date() : null,
      },

      update: {
        ...(percent !== undefined ? { percent } : {}),
        ...(lastPositionSec !== undefined ? { lastPositionSec } : {}),
        lastOpenedAt: new Date(),
        ...(shouldComplete
          ? { status: ProgressStatus.COMPLETED, completedAt: new Date() }
          : { status: ProgressStatus.IN_PROGRESS, completedAt: null }),
      },

      select: {
        lessonId: true,
        status: true,
        percent: true,
        lastPositionSec: true,
        lastOpenedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    })
  }

  // POST /lessons/:id/complete
  async completeLesson(user: JwtUser, lessonId: number) {
    return this.upsertLessonProgress(user, lessonId, { percent: 100 })
  }

  // GET /me/progress
  myProgress(userId: number) {
    return this.prisma.lessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        percent: true,
        lastPositionSec: true,
        lastOpenedAt: true,
        completedAt: true,
        updatedAt: true,
        lesson: { select: { id: true, courseId: true, title: true, order: true, published: true } },
      },
      orderBy: [{ lastOpenedAt: 'desc' }],
    })
  }

  // GET /me/courses/:courseId/progress
  // Return đúng shape cho frontend:
  // {
  //   courseId, totalLessons, completedLessons, percent,
  //   items: [{lessonId, status, seconds?, updatedAt?}]
  // }
  async getCourseProgress(user: JwtUser, courseId: number) {
    await this.enrollments.assertEnrolledOrAdmin(user, courseId)

    const lessons = await this.prisma.lesson.findMany({
      where: {
        courseId,
        ...(user.role === 'ADMIN' ? {} : { published: true }),
      },
      select: { id: true, order: true, published: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId: user.sub,
        lesson: { courseId, ...(user.role === 'ADMIN' ? {} : { published: true }) },
      },
      select: {
        lessonId: true,
        status: true,
        lastPositionSec: true,
        lastOpenedAt: true,
        updatedAt: true,
      },
      orderBy: [{ lastOpenedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 2000,
    })

    const progMap = new Map(progress.map((p) => [p.lessonId, p]))

    const totalLessons = lessons.length
    const completedLessons = lessons.filter((l) => progMap.get(l.id)?.status === ProgressStatus.COMPLETED).length
    const percentCourse = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

    // items đúng kiểu LessonProgress[] cho FE Continue
    const items = lessons
      .map((l) => {
        const p = progMap.get(l.id)
        if (!p) return null
        return {
          lessonId: l.id,
          status: p.status, // IN_PROGRESS | COMPLETED
          seconds: p.lastPositionSec ?? undefined,
          updatedAt: (p.updatedAt ?? p.lastOpenedAt)?.toISOString?.() ?? undefined,
        }
      })
      .filter(Boolean) as Array<{
      lessonId: number
      status: ProgressStatus
      seconds?: number
      updatedAt?: string
    }>

    return {
      courseId,
      totalLessons,
      completedLessons,
      percent: percentCourse,
      items,
    }
  }
}
