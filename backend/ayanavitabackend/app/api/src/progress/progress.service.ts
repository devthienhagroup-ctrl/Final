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

  private async assertLessonUnlockedOrAdmin(user: JwtUser, lessonId: number, courseId: number) {
    if (user.role === 'ADMIN') return

    const orderedLessons = await this.prisma.lesson.findMany({
      where: { courseId, published: true },
      select: { id: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    const idx = orderedLessons.findIndex((l) => l.id === lessonId)
    if (idx === -1) throw new NotFoundException('Lesson not found')
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

  private async recalculateLessonProgress(userId: number, lessonId: number) {
    const lessonVideos = await this.prisma.lessonVideo.findMany({
      where: { module: { lessonId, published: true }, published: true, mediaType: 'VIDEO' },
      select: { id: true, durationSec: true },
    })
    const totalDurationSec = lessonVideos.reduce((sum, item) => sum + Math.max(0, item.durationSec || 0), 0)

    const videoProgress = await this.prisma.lessonVideoProgress.findMany({
      where: { userId, lessonId },
      select: { videoId: true, watchedSec: true, completed: true },
    })

    const progressMap = new Map(videoProgress.map((item) => [item.videoId, item]))
    const watchedDurationSec = lessonVideos.reduce((sum, video) => {
      const row = progressMap.get(video.id)
      const capped = Math.min(video.durationSec || 0, Math.max(0, row?.watchedSec || 0))
      return sum + capped
    }, 0)

    const completedVideos = lessonVideos.filter((video) => progressMap.get(video.id)?.completed).length
    const percentByDuration = totalDurationSec <= 0 ? 0 : Math.min(100, Math.round((watchedDurationSec / totalDurationSec) * 100))
    const percentByCompletion = lessonVideos.length === 0 ? 0 : Math.min(100, Math.round((completedVideos / lessonVideos.length) * 100))

    const percent = totalDurationSec > 0 ? percentByDuration : percentByCompletion
    const isCompleted = lessonVideos.length > 0 && percent >= 100

    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: isCompleted ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        percent,
        lastPositionSec: watchedDurationSec,
        lastOpenedAt: new Date(),
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        status: isCompleted ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        percent,
        lastPositionSec: watchedDurationSec,
        lastOpenedAt: new Date(),
        completedAt: isCompleted ? new Date() : null,
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

    return { lessonProgress, watchedDurationSec, totalDurationSec, percent }
  }

  async upsertLessonProgress(user: JwtUser, lessonId: number, dto: UpsertProgressDto) {
    const lesson = await this.getLessonOrThrow(lessonId)
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)

    if (user.role !== 'ADMIN') {
      if (!lesson.course.published) throw new NotFoundException('Lesson not found')
      if (!lesson.published) throw new NotFoundException('Lesson not found')
    }

    await this.assertLessonUnlockedOrAdmin(user, lessonId, lesson.courseId)

    const percent = this.clampPercent(dto.percent)
    const shouldComplete = percent !== undefined && percent >= 100

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.sub, lessonId } },
      create: {
        userId: user.sub,
        lessonId,
        status: shouldComplete ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        percent: percent ?? 0,
        lastPositionSec: dto.lastPositionSec ?? 0,
        lastOpenedAt: new Date(),
        completedAt: shouldComplete ? new Date() : null,
      },
      update: {
        ...(percent !== undefined ? { percent } : {}),
        ...(dto.lastPositionSec !== undefined ? { lastPositionSec: dto.lastPositionSec } : {}),
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

  async upsertVideoProgress(user: JwtUser, lessonId: number, videoId: number, dto: UpsertProgressDto) {
    const lesson = await this.getLessonOrThrow(lessonId)
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)
    if (user.role !== 'ADMIN') {
      if (!lesson.course.published) throw new NotFoundException('Lesson not found')
      if (!lesson.published) throw new NotFoundException('Lesson not found')
    }
    await this.assertLessonUnlockedOrAdmin(user, lessonId, lesson.courseId)

    const video = await this.prisma.lessonVideo.findFirst({
      where: { id: videoId, module: { lessonId }, mediaType: 'VIDEO' },
      select: { id: true, durationSec: true, moduleId: true },
    })
    if (!video) throw new NotFoundException('Video not found')

    const watchedSec = Math.min(video.durationSec || 0, Math.max(0, dto.watchedSec ?? 0))
    const isCompleted = dto.completed === true || (video.durationSec > 0 && watchedSec >= video.durationSec)

    await this.prisma.lessonVideoProgress.upsert({
      where: { userId_videoId: { userId: user.sub, videoId } },
      create: {
        userId: user.sub,
        lessonId,
        moduleId: video.moduleId,
        videoId,
        watchedSec,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        watchedSec,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    })

    return this.recalculateLessonProgress(user.sub, lessonId)
  }

  async completeModule(user: JwtUser, lessonId: number, moduleId: number) {
    const lesson = await this.getLessonOrThrow(lessonId)
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)

    const videos = await this.prisma.lessonVideo.findMany({
      where: { moduleId, module: { lessonId }, mediaType: 'VIDEO', published: true },
      select: { id: true, durationSec: true },
    })
    if (videos.length === 0) throw new NotFoundException('Module not found')

    await Promise.all(videos.map((video) => this.prisma.lessonVideoProgress.upsert({
      where: { userId_videoId: { userId: user.sub, videoId: video.id } },
      create: {
        userId: user.sub,
        lessonId,
        moduleId,
        videoId: video.id,
        watchedSec: video.durationSec,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        watchedSec: video.durationSec,
        completed: true,
        completedAt: new Date(),
      },
    })))

    return this.recalculateLessonProgress(user.sub, lessonId)
  }

  async completeLesson(user: JwtUser, lessonId: number) {
    return this.upsertLessonProgress(user, lessonId, { percent: 100 })
  }

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
        updatedAt: true,
      },
    })

    const progMap = new Map(progress.map((p) => [p.lessonId, p]))
    const totalLessons = lessons.length
    const completedLessons = lessons.filter((l) => progMap.get(l.id)?.status === ProgressStatus.COMPLETED).length
    const percentCourse = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

    const items = lessons
      .map((l) => {
        const p = progMap.get(l.id)
        if (!p) return null
        return {
          lessonId: l.id,
          status: p.status,
          seconds: p.lastPositionSec ?? undefined,
          updatedAt: p.updatedAt?.toISOString?.() ?? undefined,
        }
      })
      .filter(Boolean)

    return {
      courseId,
      totalLessons,
      completedLessons,
      percent: percentCourse,
      items,
    }
  }
}
