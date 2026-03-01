import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EnrollmentsService } from '../enrollments/enrollments.service'
import { CreateCourseDto } from './dto/create-course.dto'
import { UpdateCourseDto } from './dto/update-course.dto'
import { Prisma, ProgressStatus } from '@prisma/client'
import { CourseQueryDto } from './dto/course-query.dto'
import { CoursesMediaService } from './courses-media.service'
import { UpsertCourseReviewDto } from './dto/upsert-course-review.dto'

type JwtUser = { sub: number; role: string }
type Locale = 'vi' | 'en' | 'de'
type MultiLingualStringList = Record<Locale, string[]>

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
    private readonly courseMedia: CoursesMediaService,
  ) {}

  private readonly baseCourseSelect = {
    id: true,
    topicId: true,
    title: true,
    time: true,
    shortDescription: true,
    slug: true,
    description: true,
    thumbnail: true,
    price: true,
    published: true,
    objectives: true,
    targetAudience: true,
    benefits: true,
    ratingAvg: true,
    ratingCount: true,
    enrollmentCount: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true,
    creator: { select: { id: true, name: true, email: true } },
    _count: { select: { lessons: true } },
  } as const

  private resolveCourseLocale(lang?: string): Locale {
    const activeLang = (lang || 'vi').toLowerCase()
    if (activeLang === 'en-us' || activeLang === 'en') return 'en'
    if (activeLang === 'de') return 'de'
    return 'vi'
  }

  private normalizeLocalizedList(value: unknown): MultiLingualStringList {
    const empty: MultiLingualStringList = { vi: [], en: [], de: [] }
    if (Array.isArray(value)) return { ...empty, vi: value.filter((item): item is string => typeof item === 'string') }
    if (!value || typeof value !== 'object') return empty
    const input = value as Record<string, unknown>
    return {
      vi: Array.isArray(input.vi) ? input.vi.filter((item): item is string => typeof item === 'string') : [],
      en: Array.isArray(input.en) ? input.en.filter((item): item is string => typeof item === 'string') : [],
      de: Array.isArray(input.de) ? input.de.filter((item): item is string => typeof item === 'string') : [],
    }
  }


  private hydratePrimaryContent(dto: Partial<CreateCourseDto>): Partial<CreateCourseDto> {
    const objectivesByLocale = this.normalizeLocalizedList(dto.objectives)
    const targetAudienceByLocale = this.normalizeLocalizedList(dto.targetAudience)
    const benefitsByLocale = this.normalizeLocalizedList(dto.benefits)

    const viContent = dto.contentTranslations?.vi

    return {
      ...dto,
      objectives: (dto.objectives !== undefined ? objectivesByLocale.vi : (viContent?.objectives || objectivesByLocale.vi)) as any,
      targetAudience: (dto.targetAudience !== undefined ? targetAudienceByLocale.vi : (viContent?.targetAudience || targetAudienceByLocale.vi)) as any,
      benefits: (dto.benefits !== undefined ? benefitsByLocale.vi : (viContent?.benefits || benefitsByLocale.vi)) as any,
    }
  }

  private buildCreateCoursePayload(dto: CreateCourseDto & { title: string; creatorId?: number }): Prisma.CourseUncheckedCreateInput {
    return {
      title: dto.title,
      slug: dto.slug,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.time !== undefined ? { time: String(dto.time) } : {}),
      ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.published !== undefined ? { published: dto.published } : {}),
      ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
      ...(dto.objectives !== undefined ? { objectives: dto.objectives as any } : {}),
      ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience as any } : {}),
      ...(dto.benefits !== undefined ? { benefits: dto.benefits as any } : {}),
      ...(dto.ratingAvg !== undefined ? { ratingAvg: dto.ratingAvg } : {}),
      ...(dto.ratingCount !== undefined ? { ratingCount: dto.ratingCount } : {}),
      ...(dto.enrollmentCount !== undefined ? { enrollmentCount: dto.enrollmentCount } : {}),
      ...(dto.creatorId !== undefined ? { creatorId: dto.creatorId } : {}),
    }
  }

  private buildUpdateCoursePayload(dto: UpdateCourseDto): Prisma.CourseUncheckedUpdateInput {
    return {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.time !== undefined ? { time: String(dto.time) } : {}),
      ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.published !== undefined ? { published: dto.published } : {}),
      ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
      ...(dto.objectives !== undefined ? { objectives: dto.objectives as any } : {}),
      ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience as any } : {}),
      ...(dto.benefits !== undefined ? { benefits: dto.benefits as any } : {}),
      ...(dto.ratingAvg !== undefined ? { ratingAvg: dto.ratingAvg } : {}),
      ...(dto.ratingCount !== undefined ? { ratingCount: dto.ratingCount } : {}),
      ...(dto.enrollmentCount !== undefined ? { enrollmentCount: dto.enrollmentCount } : {}),
      ...(dto.creatorId !== undefined ? { creatorId: dto.creatorId } : {}),
    }
  }

  async lessonsOutline(user: JwtUser, courseId: number, lang?: string) {
    const lessonLocale = this.resolveCourseLocale(lang)
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, published: true } })
    if (!course) throw new NotFoundException('Course not found')
    if (user.role !== 'ADMIN' && !course.published) throw new NotFoundException('Course not found')
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId, ...(user.role === 'ADMIN' ? {} : { published: true }) },
      select: {
        id: true,
        courseId: true,
        title: true,
        slug: true,
        description: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        translations: {
          where: { locale: { in: [lessonLocale, 'vi'] } },
          select: { locale: true, title: true, description: true },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    return lessons.map((lesson: any) => {
      const tr = lesson.translations?.find((item: any) => item.locale === lessonLocale) || lesson.translations?.find((item: any) => item.locale === 'vi')
      return {
        ...lesson,
        localizedTitle: tr?.title || lesson.title,
        localizedDescription: tr?.description || lesson.description || null,
      }
    })
  }

  async findAll(query: CourseQueryDto, user?: { sub: number; role: string } | null) {
    const courseLocale = this.resolveCourseLocale(query.lang)
    const topicLocale = courseLocale
    const where: Prisma.CourseWhereInput = {
      ...(user?.role === 'ADMIN' ? {} : { published: true }),
      ...(query.topicId ? { topicId: query.topicId } : {}),
      ...(query.search?.trim() ? { OR: [{ title: { contains: query.search.trim() } }, { slug: { contains: query.search.trim() } }] } : {}),
    }
    const page = Math.max(1, Number(query.page || 1)); const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 10)))
    const [rows, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: {
          ...this.baseCourseSelect,
          translations: { where: { locale: { in: [courseLocale, 'vi'] } }, select: { locale: true, title: true, shortDescription: true, description: true, objectives: true, targetAudience: true, benefits: true } },
          contentTranslations: { where: { locale: { in: [courseLocale, 'vi'] } }, select: { locale: true, objectives: true, targetAudience: true, benefits: true } },
          topic: { select: { id: true, name: true, translations: { where: { locale: { in: [topicLocale, 'vi'] } }, select: { locale: true, name: true } } } },
        },
        skip: (page - 1) * pageSize, take: pageSize, orderBy: { id: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ])
    const courseIds = rows.map((r) => r.id)
    if (!courseIds.length) return { items: [], total, page, pageSize }
    const videoRows = await this.prisma.$queryRaw<Array<{ courseId: number; videoCount: bigint | number }>>`SELECT l.courseId as courseId, COUNT(v.id) as videoCount FROM LessonVideo v INNER JOIN LessonModule m ON m.id = v.moduleId INNER JOIN Lesson l ON l.id = m.lessonId WHERE l.courseId IN (${Prisma.join(courseIds)}) GROUP BY l.courseId`
    const videoCountMap = new Map(videoRows.map((r) => [Number(r.courseId), Number(r.videoCount)]))
    const items = rows.map((row: any) => {
      const tr = row.translations?.find((x: any) => x.locale === courseLocale) || row.translations?.find((x: any) => x.locale === 'vi')
      const ct = row.translations?.find((x: any) => x.locale === courseLocale) || row.translations?.find((x: any) => x.locale === 'vi')
      const legacyCt = row.contentTranslations?.find((x: any) => x.locale === courseLocale) || row.contentTranslations?.find((x: any) => x.locale === 'vi')
      const tt = row.topic?.translations?.find((x: any) => x.locale === topicLocale) || row.topic?.translations?.find((x: any) => x.locale === 'vi')
      return { ...row, title: tr?.title || row.title, shortDescription: tr?.shortDescription || row.shortDescription, description: tr?.description || row.description, objectives: ct?.objectives || legacyCt?.objectives || row.objectives, targetAudience: ct?.targetAudience || legacyCt?.targetAudience || row.targetAudience, benefits: ct?.benefits || legacyCt?.benefits || row.benefits, topic: row.topic ? { id: row.topic.id, name: tt?.name || row.topic.name } : null, videoCount: videoCountMap.get(row.id) || 0 }
    })
    return { items, total, page, pageSize }
  }

  async listTopics(lang?: string, user?: { sub: number; role: string } | null) {
    const locale = this.resolveCourseLocale(lang)
    const topics = await this.prisma.courseTopic.findMany({
      where: {
        ...(user?.role === 'ADMIN'
          ? {}
          : {
              courses: {
                some: { published: true },
              },
            }),
      },
      select: {
        id: true,
        name: true,
        translations: {
          where: { locale: { in: [locale, 'vi'] } },
          select: { locale: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return topics.map((topic: any) => {
      const translation = topic.translations?.find((item: any) => item.locale === locale) || topic.translations?.find((item: any) => item.locale === 'vi')
      return {
        id: topic.id,
        name: translation?.name || topic.name,
      }
    })
  }


  async uploadThumbnail(file: { buffer: Buffer }) {
    return this.courseMedia.uploadThumbnail(file)
  }
  async findOne(id: number, lang?: string) {
    const courseLocale = this.resolveCourseLocale(lang)
    const c = await this.prisma.course.findUnique({
      where: { id },
      select: {
        ...this.baseCourseSelect,
        translations: { select: { locale: true, title: true, shortDescription: true, description: true, objectives: true, targetAudience: true, benefits: true } },
        contentTranslations: { select: { locale: true, objectives: true, targetAudience: true, benefits: true } },
        topic: { select: { id: true, name: true, translations: { where: { locale: { in: [courseLocale, 'vi'] } }, select: { locale: true, name: true } } } },
      },
    })
    if (!c) throw new NotFoundException('Course not found')
    const tr = (c as any).translations?.find((x: any) => x.locale === courseLocale) || (c as any).translations?.find((x: any) => x.locale === 'vi')
    const ct = (c as any).translations?.find((x: any) => x.locale === courseLocale) || (c as any).translations?.find((x: any) => x.locale === 'vi')
    const legacyCt = (c as any).contentTranslations?.find((x: any) => x.locale === courseLocale) || (c as any).contentTranslations?.find((x: any) => x.locale === 'vi')
    const tt = (c as any).topic?.translations?.find((x: any) => x.locale === courseLocale) || (c as any).topic?.translations?.find((x: any) => x.locale === 'vi')

    const videoRows = await this.prisma.$queryRaw<Array<{ videoCount: bigint | number }>>`
      SELECT COUNT(v.id) as videoCount
      FROM LessonVideo v
      INNER JOIN LessonModule m ON m.id = v.moduleId
      INNER JOIN Lesson l ON l.id = m.lessonId
      WHERE l.courseId = ${id}
    `

    return {
      ...c,
      title: tr?.title || c.title,
      shortDescription: tr?.shortDescription || c.shortDescription,
      description: tr?.description || c.description,
      objectives: ct?.objectives || legacyCt?.objectives || c.objectives,
      targetAudience: ct?.targetAudience || legacyCt?.targetAudience || c.targetAudience,
      benefits: ct?.benefits || legacyCt?.benefits || c.benefits,
      topic: (c as any).topic ? { id: (c as any).topic.id, name: tt?.name || (c as any).topic.name } : null,
      videoCount: Number(videoRows[0]?.videoCount || 0),
    }
  }

  async create(dto: CreateCourseDto, thumbnailFile?: { buffer: Buffer; mimetype?: string }, creatorId?: number) {
    if (!dto.title?.trim()) throw new BadRequestException('Title is required')
    const normalizedDto = this.hydratePrimaryContent(dto) as CreateCourseDto
    try {
      const thumbnailUrl = thumbnailFile ? (await this.courseMedia.uploadThumbnail(thumbnailFile)).url : normalizedDto.thumbnail
      const created = await this.prisma.course.create({ data: this.buildCreateCoursePayload({ ...normalizedDto, title: normalizedDto.title!.trim(), thumbnail: thumbnailUrl, creatorId }), select: this.baseCourseSelect })
      await this.syncCourseTranslations(created.id, normalizedDto)
      return created
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Slug already exists')
      throw e
    }
  }

  async update(id: number, dto: UpdateCourseDto, thumbnailFile?: { buffer: Buffer; mimetype?: string; originalname?: string }) {
    const normalizedDto = this.hydratePrimaryContent(dto) as UpdateCourseDto
    const existing = await this.prisma.course.findUnique({ where: { id }, select: { id: true, thumbnail: true } })
    if (!existing) throw new NotFoundException('Course not found')

    let nextThumbnail = normalizedDto.thumbnail
    if (thumbnailFile) {
      const uploaded = await this.courseMedia.uploadThumbnail(thumbnailFile)
      nextThumbnail = uploaded.url
      if (existing.thumbnail) {
        await this.courseMedia.deleteThumbnailByUrl(existing.thumbnail)
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: this.buildUpdateCoursePayload({ ...normalizedDto, ...(nextThumbnail !== undefined ? { thumbnail: nextThumbnail } : {}) }),
      select: this.baseCourseSelect,
    })
    await this.syncCourseTranslations(id, normalizedDto)
    return updated
  }

  async remove(id: number) {
    const existing = await this.prisma.course.findUnique({ where: { id }, select: { id: true, thumbnail: true } })
    if (!existing) throw new NotFoundException('Course not found')

    if (existing.thumbnail) {
      await this.courseMedia.deleteThumbnailByUrl(existing.thumbnail)
    }

    return this.prisma.course.delete({ where: { id }, select: { id: true } })
  }

  async findAllByCreator(query: CourseQueryDto, creatorId: number) {
    const scopedQuery = { ...query }
    const courseLocale = this.resolveCourseLocale(scopedQuery.lang)
    const topicLocale = courseLocale
    const where: Prisma.CourseWhereInput = {
      creatorId,
      ...(scopedQuery.topicId ? { topicId: scopedQuery.topicId } : {}),
      ...(scopedQuery.search?.trim() ? { OR: [{ title: { contains: scopedQuery.search.trim() } }, { slug: { contains: scopedQuery.search.trim() } }] } : {}),
    }
    const page = Math.max(1, Number(scopedQuery.page || 1)); const pageSize = Math.min(100, Math.max(1, Number(scopedQuery.pageSize || 10)))
    const [rows, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: {
          ...this.baseCourseSelect,
          translations: { where: { locale: { in: [courseLocale, 'vi'] } }, select: { locale: true, title: true, shortDescription: true, description: true, objectives: true, targetAudience: true, benefits: true } },
          contentTranslations: { where: { locale: { in: [courseLocale, 'vi'] } }, select: { locale: true, objectives: true, targetAudience: true, benefits: true } },
          topic: { select: { id: true, name: true, translations: { where: { locale: { in: [topicLocale, 'vi'] } }, select: { locale: true, name: true } } } },
        },
        skip: (page - 1) * pageSize, take: pageSize, orderBy: { id: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ])
    const courseIds = rows.map((r) => r.id)
    if (!courseIds.length) return { items: [], total, page, pageSize }
    const videoRows = await this.prisma.$queryRaw<Array<{ courseId: number; videoCount: bigint | number }>>`SELECT l.courseId as courseId, COUNT(v.id) as videoCount FROM LessonVideo v INNER JOIN LessonModule m ON m.id = v.moduleId INNER JOIN Lesson l ON l.id = m.lessonId WHERE l.courseId IN (${Prisma.join(courseIds)}) GROUP BY l.courseId`
    const videoCountMap = new Map(videoRows.map((r) => [Number(r.courseId), Number(r.videoCount)]))
    const items = rows.map((row: any) => {
      const tr = row.translations?.find((x: any) => x.locale === courseLocale) || row.translations?.find((x: any) => x.locale === 'vi')
      const ct = row.translations?.find((x: any) => x.locale === courseLocale) || row.translations?.find((x: any) => x.locale === 'vi')
      const legacyCt = row.contentTranslations?.find((x: any) => x.locale === courseLocale) || row.contentTranslations?.find((x: any) => x.locale === 'vi')
      const tt = row.topic?.translations?.find((x: any) => x.locale === topicLocale) || row.topic?.translations?.find((x: any) => x.locale === 'vi')
      return { ...row, title: tr?.title || row.title, shortDescription: tr?.shortDescription || row.shortDescription, description: tr?.description || row.description, objectives: ct?.objectives || legacyCt?.objectives || row.objectives, targetAudience: ct?.targetAudience || legacyCt?.targetAudience || row.targetAudience, benefits: ct?.benefits || legacyCt?.benefits || row.benefits, topic: row.topic ? { id: row.topic.id, name: tt?.name || row.topic.name } : null, videoCount: videoCountMap.get(row.id) || 0 }
    })
    return { items, total, page, pageSize }
  }

  async assertCreator(courseId: number, userId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, creatorId: true } })
    if (!course) throw new NotFoundException('Course not found')
    if (course.creatorId !== userId) throw new ForbiddenException('You do not have permission for this course')
  }


  async listLessons(user: { sub: number; role: string }, courseId: number) { /* kept */
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, published: true } }); if (!course) throw new NotFoundException('Course not found'); await this.enrollments.assertEnrolledOrAdmin(user, courseId); if (user.role !== 'ADMIN' && !course.published) throw new NotFoundException('Course not found')
    const lessons = await this.prisma.lesson.findMany({ where: { courseId, ...(user.role === 'ADMIN' ? {} : { published: true }) }, select: { id: true, courseId: true, title: true, slug: true, order: true, published: true, createdAt: true, updatedAt: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] })
    if (user.role === 'ADMIN') return lessons.map((l) => ({ ...l, locked: false, lockReason: null, progress: null }))
    const progressRows = await this.prisma.lessonProgress.findMany({ where: { userId: user.sub, lessonId: { in: lessons.map((l) => l.id) } }, select: { lessonId: true, status: true, percent: true, lastPositionSec: true, lastOpenedAt: true, completedAt: true, updatedAt: true } })
    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p])); let prevCompleted = true
    return lessons.map((lesson, idx) => { const progress = progressMap.get(lesson.id) ?? null; const locked = idx === 0 ? false : prevCompleted === false; const lockReason = locked ? 'PREV_NOT_COMPLETED' : null; prevCompleted = progress?.status === ProgressStatus.COMPLETED; return { ...lesson, locked, lockReason, progress } })
  }

  async getLessonDetail(user: { sub: number; role: string }, courseId: number, lessonId: number) { /* kept */
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, published: true } }); if (!course) throw new NotFoundException('Course not found'); await this.enrollments.assertEnrolledOrAdmin(user, courseId); if (user.role !== 'ADMIN' && !course.published) throw new NotFoundException('Course not found')
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, courseId }, select: { id: true, courseId: true, title: true, slug: true, content: true, videoUrl: true, order: true, published: true, createdAt: true, updatedAt: true } }); if (!lesson) throw new NotFoundException('Lesson not found')
    if (user.role !== 'ADMIN' && !lesson.published) throw new NotFoundException('Lesson not found')
    if (user.role !== 'ADMIN') { const orderedLessons = await this.prisma.lesson.findMany({ where: { courseId, published: true }, select: { id: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }); const idx = orderedLessons.findIndex((l) => l.id === lessonId); if (idx < 0) throw new NotFoundException('Lesson not found'); if (idx > 0) { const prevLessonId = orderedLessons[idx - 1].id; const prevProgress = await this.prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.sub, lessonId: prevLessonId } }, select: { status: true } }); if (prevProgress?.status !== ProgressStatus.COMPLETED) throw new ForbiddenException('Lesson locked') } }
    const progress = await this.prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.sub, lessonId } }, select: { lessonId: true, status: true, percent: true, lastPositionSec: true, lastOpenedAt: true, completedAt: true, updatedAt: true } })
    return { ...lesson, progress: progress ?? null }
  }

  async listReviews(courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) throw new NotFoundException('Course not found')

    const rows = await this.prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        stars: true,
        comment: true,
        customerName: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      stars: row.stars,
      comment: row.comment,
      customerName: row.customerName || row.user?.name || row.user?.email || 'Học viên',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  }

  async upsertReview(user: JwtUser, courseId: number, dto: UpsertCourseReviewDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) throw new NotFoundException('Course not found')
    await this.enrollments.assertEnrolledOrAdmin(user, courseId)

    const profile = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { name: true, email: true },
    })

    const customerName = dto.customerName?.trim() || profile?.name || profile?.email || 'Học viên'
    const comment = dto.comment?.trim() || null

    const existing = await this.prisma.courseReview.findFirst({
      where: { courseId, userId: user.sub },
      select: { id: true },
    })

    const review = existing
      ? await this.prisma.courseReview.update({
          where: { id: existing.id },
          data: { stars: dto.stars, comment, customerName },
          select: { id: true, stars: true, comment: true, customerName: true, createdAt: true, updatedAt: true },
        })
      : await this.prisma.courseReview.create({
          data: { courseId, userId: user.sub, stars: dto.stars, comment, customerName },
          select: { id: true, stars: true, comment: true, customerName: true, createdAt: true, updatedAt: true },
        })

    const aggregate = await this.prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { stars: true },
      _count: { id: true },
    })

    const ratingAvg = Number((aggregate._avg.stars || 0).toFixed(1))
    const ratingCount = aggregate._count.id

    await this.prisma.course.update({
      where: { id: courseId },
      data: { ratingAvg, ratingCount },
      select: { id: true },
    })

    return { ...review, ratingAvg, ratingCount }
  }


  private async syncCourseTranslations(courseId: number, dto: Partial<CreateCourseDto>) {
    const locales: Array<'vi' | 'en' | 'de'> = ['vi', 'en', 'de']
    const objectivesByLocale = this.normalizeLocalizedList(dto.objectives)
    const targetAudienceByLocale = this.normalizeLocalizedList(dto.targetAudience)
    const benefitsByLocale = this.normalizeLocalizedList(dto.benefits)

    await Promise.all(locales.map(async (locale) => {
      const tr = dto.translations?.[locale]
      const title = tr?.title || (locale === 'vi' ? dto.title : undefined)

      if (title?.trim()) {
        await this.prisma.courseTranslation.upsert({
          where: { courseId_locale: { courseId, locale } },
          update: {
            title: title.trim(),
            shortDescription: tr?.shortDescription?.trim() || (locale === 'vi' ? dto.shortDescription?.trim() || null : null),
            description: tr?.description?.trim() || (locale === 'vi' ? dto.description?.trim() || null : null),
            objectives: (tr?.objectives || dto.contentTranslations?.[locale]?.objectives || objectivesByLocale[locale] || []) as any,
            targetAudience: (tr?.targetAudience || dto.contentTranslations?.[locale]?.targetAudience || targetAudienceByLocale[locale] || []) as any,
            benefits: (tr?.benefits || dto.contentTranslations?.[locale]?.benefits || benefitsByLocale[locale] || []) as any,
          },
          create: {
            courseId,
            locale,
            title: title.trim(),
            shortDescription: tr?.shortDescription?.trim() || (locale === 'vi' ? dto.shortDescription?.trim() || null : null),
            description: tr?.description?.trim() || (locale === 'vi' ? dto.description?.trim() || null : null),
            objectives: (tr?.objectives || dto.contentTranslations?.[locale]?.objectives || objectivesByLocale[locale] || []) as any,
            targetAudience: (tr?.targetAudience || dto.contentTranslations?.[locale]?.targetAudience || targetAudienceByLocale[locale] || []) as any,
            benefits: (tr?.benefits || dto.contentTranslations?.[locale]?.benefits || benefitsByLocale[locale] || []) as any,
          },
        })
      }

      const ct = dto.contentTranslations?.[locale]
      if (ct || locale === 'vi') {
        await this.prisma.courseContentTranslation.upsert({
          where: { courseId_locale: { courseId, locale } },
          update: {
            objectives: (ct?.objectives || objectivesByLocale[locale] || []) as any,
            targetAudience: (ct?.targetAudience || targetAudienceByLocale[locale] || []) as any,
            benefits: (ct?.benefits || benefitsByLocale[locale] || []) as any,
          },
          create: {
            courseId,
            locale,
            objectives: (ct?.objectives || objectivesByLocale[locale] || []) as any,
            targetAudience: (ct?.targetAudience || targetAudienceByLocale[locale] || []) as any,
            benefits: (ct?.benefits || benefitsByLocale[locale] || []) as any,
          },
        })
      }
    }))
  }

}
