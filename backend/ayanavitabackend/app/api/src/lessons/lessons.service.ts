import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLessonDto } from './dto/create-lesson.dto'
import { UpdateLessonDto } from './dto/update-lesson.dto'
import { EnrollmentsService } from '../enrollments/enrollments.service'
import { LessonsMediaService } from './lessons-media.service'
import { JwtUser } from '../auth/decorators/current-user.decorator'
import { LessonMediaType, ProgressStatus } from '@prisma/client'

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService, private readonly enrollments: EnrollmentsService, private readonly media: LessonsMediaService) {}

  async findOne(user: JwtUser, id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true, courseId: true, title: true, slug: true, description: true, stt: true, content: true, createdAt: true, updatedAt: true,
        translations: { select: { locale: true, title: true, description: true } },
        modules: { orderBy: [{ stt: 'asc' }, { id: 'asc' }], select: {
          id: true, title: true, description: true, stt: true,
          translations: { select: { locale: true, title: true, description: true } },
          videos: { orderBy: [{ stt: 'asc' }, { id: 'asc' }], select: { id: true, title: true, description: true, sourceUrl: true, hlsPlaylistKey: true, mediaType: true, durationSec: true, stt: true, translations: { select: { locale: true, title: true, description: true } } } },
        } },
      },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)
    if (user.role !== 'ADMIN') {
      const prev = await this.prisma.lesson.findFirst({ where: { courseId: lesson.courseId, OR: [{ stt: { lt: lesson.stt ?? 0 } }, { stt: lesson.stt ?? 0, id: { lt: lesson.id } }] }, select: { id: true }, orderBy: [{ stt: 'desc' }, { id: 'desc' }] })
      if (prev) {
        const prevProgress = await this.prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.sub, lessonId: prev.id } }, select: { status: true } })
        if (!prevProgress || prevProgress.status !== ProgressStatus.COMPLETED) throw new ForbiddenException('Complete previous lesson first')
      }
    }
    return lesson
  }

  async create(courseId: number, dto: CreateLessonDto) {
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({ data: { courseId, title: dto.title, slug: dto.slug, description: dto.description, content: dto.content, stt: dto.stt } as any })
      await this.upsertLessonTranslations(tx, lesson.id, dto)
      if (dto.modules?.length) {
        for (const m of dto.modules) {
          const mod = await tx.lessonModule.create({ data: { lessonId: lesson.id, title: m.title, description: m.description, stt: m.stt } as any })
          await this.upsertModuleTranslations(tx, mod.id, m)
          if (m.videos?.length) {
            for (const v of m.videos) {
              const video = await tx.lessonVideo.create({ data: { moduleId: mod.id, title: v.title, description: v.description, sourceUrl: v.sourceUrl, mediaType: v.mediaType === 'IMAGE' ? LessonMediaType.IMAGE : LessonMediaType.VIDEO, durationSec: v.durationSec ?? 0, stt: v.stt } as any })
              await this.upsertVideoTranslations(tx, video.id, v)
            }
          }
        }
      }
      return lesson
    })
  }

  async uploadModuleMedia(lessonId: number, moduleId: string, type: 'video' | 'image', file: { buffer: Buffer; originalname?: string }, stt?: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const module = await this.prisma.lessonModule.findFirst({ where: { id: Number(moduleId), lessonId }, select: { id: true } })
    if (!module) throw new NotFoundException('Module not found')

    const resolvedStt = Number.isFinite(stt) ? Number(stt) : 0

    if (type === 'image') {
      const uploaded = await this.media.convertImageToWebpAndUpload(file, lessonId, moduleId)
      const existing = await this.prisma.lessonVideo.findFirst({ where: { moduleId: module.id, stt: resolvedStt }, orderBy: { id: 'asc' }, select: { id: true } })
      const video = existing
        ? await this.prisma.lessonVideo.update({ where: { id: existing.id }, data: { mediaType: LessonMediaType.IMAGE, sourceUrl: uploaded.sourceUrl, hlsPlaylistKey: null, published: true } })
        : await this.prisma.lessonVideo.create({ data: { moduleId: module.id, title: `image-${resolvedStt}`, description: null, mediaType: LessonMediaType.IMAGE, sourceUrl: uploaded.sourceUrl, durationSec: 0, stt: resolvedStt, published: true } })
      return { ...uploaded, videoId: video.id }
    }

    const uploaded = await this.media.transcodeToHlsAndUpload(file, lessonId, moduleId)
    const existing = await this.prisma.lessonVideo.findFirst({ where: { moduleId: module.id, stt: resolvedStt }, orderBy: { id: 'asc' }, select: { id: true } })
    const video = existing
      ? await this.prisma.lessonVideo.update({ where: { id: existing.id }, data: { mediaType: LessonMediaType.VIDEO, sourceUrl: uploaded.playlistKey, hlsPlaylistKey: uploaded.playlistKey, published: true } })
      : await this.prisma.lessonVideo.create({ data: { moduleId: module.id, title: `video-${resolvedStt}`, description: null, mediaType: LessonMediaType.VIDEO, sourceUrl: uploaded.playlistKey, hlsPlaylistKey: uploaded.playlistKey, durationSec: 0, stt: resolvedStt, published: true } })
    return { ...uploaded, videoId: video.id }
  }

  async update(id: number, dto: UpdateLessonDto) {
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({ where: { id }, data: { title: dto.title, slug: dto.slug, description: dto.description, content: dto.content, stt: dto.stt } as any })
      await this.upsertLessonTranslations(tx, id, dto)
      if (dto.modules) {
        await tx.lessonVideoTranslation.deleteMany({ where: { video: { module: { lessonId: id } } } as any })
        await tx.lessonModuleTranslation.deleteMany({ where: { module: { lessonId: id } } as any })
        await tx.lessonVideo.deleteMany({ where: { module: { lessonId: id } } as any })
        await tx.lessonModule.deleteMany({ where: { lessonId: id } })
        for (const m of dto.modules) {
          const mod = await tx.lessonModule.create({ data: { lessonId: id, title: m.title, description: m.description, stt: m.stt } as any })
          await this.upsertModuleTranslations(tx, mod.id, m)
          for (const v of (m.videos || [])) {
            const video = await tx.lessonVideo.create({ data: { moduleId: mod.id, title: v.title, description: v.description, sourceUrl: v.sourceUrl, mediaType: v.mediaType === 'IMAGE' ? LessonMediaType.IMAGE : LessonMediaType.VIDEO, durationSec: v.durationSec ?? 0, stt: v.stt } as any })
            await this.upsertVideoTranslations(tx, video.id, v)
          }
        }
      }
      return lesson
    })
  }

  remove(id: number) { return this.prisma.lesson.delete({ where: { id } }) }

  private async upsertLessonTranslations(tx: any, lessonId: number, dto: any) {
    for (const locale of ['vi', 'en', 'de']) {
      const tr = dto.translations?.[locale]
      const title = tr?.title || (locale === 'vi' ? dto.title : undefined)
      if (!title) continue
      await tx.lessonTranslation.upsert({ where: { lessonId_locale: { lessonId, locale } }, update: { title, description: tr?.description || (locale === 'vi' ? dto.description : null) }, create: { lessonId, locale, title, description: tr?.description || (locale === 'vi' ? dto.description : null) } })
    }
  }
  private async upsertModuleTranslations(tx: any, moduleId: number, dto: any) {
    for (const locale of ['vi', 'en', 'de']) {
      const tr = dto.translations?.[locale]
      const title = tr?.title || (locale === 'vi' ? dto.title : undefined)
      if (!title) continue
      await tx.lessonModuleTranslation.upsert({ where: { moduleId_locale: { moduleId, locale } }, update: { title, description: tr?.description || (locale === 'vi' ? dto.description : null) }, create: { moduleId, locale, title, description: tr?.description || (locale === 'vi' ? dto.description : null) } })
    }
  }
  private async upsertVideoTranslations(tx: any, videoId: number, dto: any) {
    for (const locale of ['vi', 'en', 'de']) {
      const tr = dto.translations?.[locale]
      const title = tr?.title || (locale === 'vi' ? dto.title : undefined)
      if (!title) continue
      await tx.lessonVideoTranslation.upsert({ where: { videoId_locale: { videoId, locale } }, update: { title, description: tr?.description || (locale === 'vi' ? dto.description : null) }, create: { videoId, locale, title, description: tr?.description || (locale === 'vi' ? dto.description : null) } })
    }
  }
}
