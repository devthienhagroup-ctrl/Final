import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentsService } from "../enrollments/enrollments.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { Prisma, ProgressStatus } from "@prisma/client";
import { CourseQueryDto } from "./dto/course-query.dto";

type JwtUser = { sub: number; role: string }

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService
  ) {}

  private readonly baseCourseSelect = {
    id: true,
    topicId: true,
    title: true,
    shortDescription: true,
    slug: true,
    description: true,
    thumbnail: true,
    price: true,
    published: true,
    titleI18n: true,
    descriptionI18n: true,
    shortDescriptionI18n: true,
    objectives: true,
    targetAudience: true,
    benefits: true,
    ratingAvg: true,
    ratingCount: true,
    enrollmentCount: true,
    createdAt: true,
    updatedAt: true,
    topic: { select: { id: true, name: true } },
    _count: { select: { lessons: true } },
  } as const

  private buildCreateCoursePayload(dto: CreateCourseDto & { title: string }): Prisma.CourseUncheckedCreateInput {
    return {
      title: dto.title,
      slug: dto.slug,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.published !== undefined ? { published: dto.published } : {}),
      ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
      ...(dto.titleI18n !== undefined ? { titleI18n: dto.titleI18n as any } : {}),
      ...(dto.descriptionI18n !== undefined ? { descriptionI18n: dto.descriptionI18n as any } : {}),
      ...(dto.shortDescriptionI18n !== undefined ? { shortDescriptionI18n: dto.shortDescriptionI18n as any } : {}),
      ...(dto.objectives !== undefined ? { objectives: dto.objectives as any } : {}),
      ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience as any } : {}),
      ...(dto.benefits !== undefined ? { benefits: dto.benefits as any } : {}),
      ...(dto.ratingAvg !== undefined ? { ratingAvg: dto.ratingAvg } : {}),
      ...(dto.ratingCount !== undefined ? { ratingCount: dto.ratingCount } : {}),
      ...(dto.enrollmentCount !== undefined ? { enrollmentCount: dto.enrollmentCount } : {}),
    }
  }

  private buildUpdateCoursePayload(dto: UpdateCourseDto): Prisma.CourseUncheckedUpdateInput {
    return {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.published !== undefined ? { published: dto.published } : {}),
      ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
      ...(dto.titleI18n !== undefined ? { titleI18n: dto.titleI18n as any } : {}),
      ...(dto.descriptionI18n !== undefined ? { descriptionI18n: dto.descriptionI18n as any } : {}),
      ...(dto.shortDescriptionI18n !== undefined ? { shortDescriptionI18n: dto.shortDescriptionI18n as any } : {}),
      ...(dto.objectives !== undefined ? { objectives: dto.objectives as any } : {}),
      ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience as any } : {}),
      ...(dto.benefits !== undefined ? { benefits: dto.benefits as any } : {}),
      ...(dto.ratingAvg !== undefined ? { ratingAvg: dto.ratingAvg } : {}),
      ...(dto.ratingCount !== undefined ? { ratingCount: dto.ratingCount } : {}),
      ...(dto.enrollmentCount !== undefined ? { enrollmentCount: dto.enrollmentCount } : {}),
    }
  }

  async lessonsOutline(user: JwtUser, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, published: true },
    })
    if (!course) throw new NotFoundException('Course not found')

    if (user.role !== 'ADMIN' && !course.published) {
      throw new NotFoundException('Course not found')
    }

    return this.prisma.lesson.findMany({
      where: {
        courseId,
        ...(user.role === 'ADMIN' ? {} : { published: true }),
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        slug: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })
  }

  async findAll(query: CourseQueryDto, user?: { sub: number; role: string } | null) {
    const activeLang = (query.lang || 'vi').toLowerCase()
    const courseLocale = activeLang === 'en-us' || activeLang === 'en' ? 'en' : activeLang === 'de' ? 'de' : 'vi'
    const topicLocale = activeLang === 'en' ? 'en' : activeLang === 'en-us' ? 'en' : activeLang === 'de' ? 'de' : 'vi'

    const where: Prisma.CourseWhereInput = {
      ...(user?.role === 'ADMIN' ? {} : { published: true }),
      ...(query.topicId ? { topicId: query.topicId } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim() } },
              { slug: { contains: query.search.trim() } },
            ],
          }
        : {}),
    }

    const page = Math.max(1, Number(query.page || 1))
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 10)))

    const [rows, total] = await Promise.all([
      this.prisma.course.findMany({
      where,
      select: {
        ...this.baseCourseSelect,
        translations: {
          where: { locale: { in: [courseLocale, 'vi'] } },
          select: { locale: true, title: true, shortDescription: true, description: true },
        },
        topic: {
          select: {
            id: true,
            name: true,
            translations: {
              where: { locale: { in: [topicLocale, 'vi'] } },
              select: { locale: true, name: true },
            },
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
      }),
      this.prisma.course.count({ where }),
    ])

    const courseIds = rows.map((row) => row.id)
    if (!courseIds.length) {
      return { items: [], total, page, pageSize }
    }

    const videoRows = await this.prisma.$queryRaw<Array<{ courseId: number; videoCount: bigint | number }>>`
      SELECT l.courseId as courseId, COUNT(v.id) as videoCount
      FROM LessonVideo v
      INNER JOIN LessonModule m ON m.id = v.moduleId
      INNER JOIN Lesson l ON l.id = m.lessonId
      WHERE l.courseId IN (${Prisma.join(courseIds)})
      GROUP BY l.courseId
    `

    const videoCountMap = new Map(videoRows.map((row) => [Number(row.courseId), Number(row.videoCount)]))
    const items = rows.map((row: any) => {
      const chosenCourseTrans = row.translations?.find((item: any) => item.locale === courseLocale) || row.translations?.find((item: any) => item.locale === 'vi')
      const chosenTopicTrans = row.topic?.translations?.find((item: any) => item.locale === topicLocale) || row.topic?.translations?.find((item: any) => item.locale === 'vi')

      return {
        ...row,
        title: chosenCourseTrans?.title || row.title,
        shortDescription: chosenCourseTrans?.shortDescription || row.shortDescription,
        description: chosenCourseTrans?.description || row.description,
        topic: row.topic
          ? {
              id: row.topic.id,
              name: chosenTopicTrans?.name || row.topic.name,
            }
          : null,
        videoCount: videoCountMap.get(row.id) || 0,
      }
    })

    return { items, total, page, pageSize }
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: this.baseCourseSelect,
    });
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }

  async create(dto: CreateCourseDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException("Title is required")
    }

    try {
      const created = await this.prisma.course.create({
        data: this.buildCreateCoursePayload({ ...dto, title: dto.title.trim() }),
        select: this.baseCourseSelect,
      })
      await this.syncCourseTranslations(created.id, dto)
      return created
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = (e.meta as any)?.target;
        if (Array.isArray(target) ? target.includes("slug") : String(target).includes("slug")) {
          throw new ConflictException("Slug already exists");
        }
        throw new ConflictException("Unique constraint failed");
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateCourseDto) {
    await this.ensureCourseExists(id);
    const updated = await this.prisma.course.update({
      where: { id },
      data: this.buildUpdateCoursePayload(dto),
      select: this.baseCourseSelect,
    })
    await this.syncCourseTranslations(id, dto)
    return updated
  }

  async remove(id: number) {
    await this.ensureCourseExists(id);
    return this.prisma.course.delete({ where: { id }, select: { id: true } });
  }

  async listLessons(user: { sub: number; role: string }, courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, published: true } });
    if (!course) throw new NotFoundException("Course not found");
    await this.enrollments.assertEnrolledOrAdmin(user, courseId);
    if (user.role !== "ADMIN" && !course.published) throw new NotFoundException("Course not found");

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId, ...(user.role === "ADMIN" ? {} : { published: true }) },
      select: { id: true, courseId: true, title: true, slug: true, order: true, published: true, createdAt: true, updatedAt: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    if (user.role === "ADMIN") return lessons.map((l) => ({ ...l, locked: false, lockReason: null, progress: null }));

    const progressRows = await this.prisma.lessonProgress.findMany({
      where: { userId: user.sub, lessonId: { in: lessons.map((l) => l.id) } },
      select: { lessonId: true, status: true, percent: true, lastPositionSec: true, lastOpenedAt: true, completedAt: true, updatedAt: true },
    });

    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));
    let prevCompleted = true;
    return lessons.map((lesson, idx) => {
      const progress = progressMap.get(lesson.id) ?? null;
      const locked = idx === 0 ? false : prevCompleted === false;
      const lockReason = locked ? "PREV_NOT_COMPLETED" : null;
      prevCompleted = progress?.status === ProgressStatus.COMPLETED;
      return { ...lesson, locked, lockReason, progress };
    });
  }

  async getLessonDetail(user: { sub: number; role: string }, courseId: number, lessonId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, published: true } });
    if (!course) throw new NotFoundException("Course not found");
    await this.enrollments.assertEnrolledOrAdmin(user, courseId);
    if (user.role !== "ADMIN" && !course.published) throw new NotFoundException("Course not found");

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
      select: { id: true, courseId: true, title: true, slug: true, content: true, videoUrl: true, order: true, published: true, createdAt: true, updatedAt: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");
    if (user.role !== "ADMIN" && !lesson.published) throw new NotFoundException("Lesson not found");

    if (user.role !== "ADMIN") {
      const orderedLessons = await this.prisma.lesson.findMany({ where: { courseId, published: true }, select: { id: true }, orderBy: [{ order: "asc" }, { id: "asc" }] });
      const idx = orderedLessons.findIndex((l) => l.id === lessonId);
      if (idx < 0) throw new NotFoundException("Lesson not found");
      if (idx > 0) {
        const prevLessonId = orderedLessons[idx - 1].id;
        const prevProgress = await this.prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.sub, lessonId: prevLessonId } }, select: { status: true } });
        const unlocked = prevProgress?.status === ProgressStatus.COMPLETED;
        if (!unlocked) throw new ForbiddenException("Lesson locked");
      }
    }

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.sub, lessonId } },
      select: { lessonId: true, status: true, percent: true, lastPositionSec: true, lastOpenedAt: true, completedAt: true, updatedAt: true },
    });

    return { ...lesson, progress: progress ?? null };
  }

  private async ensureCourseExists(id: number) {
    const ok = await this.prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!ok) throw new NotFoundException("Course not found");
  }

  private async syncCourseTranslations(courseId: number, dto: Partial<CreateCourseDto>) {
    const locales: Array<'vi' | 'en' | 'de'> = ['vi', 'en', 'de']
    const mapLocale = (locale: 'vi' | 'en' | 'de') => (locale === 'en' ? 'en' : locale)

    await Promise.all(
      locales.map((locale) => {
        const inputLocale = mapLocale(locale)
        const title = dto.titleI18n?.[inputLocale] || (locale === 'vi' ? dto.title : undefined)
        const description = dto.descriptionI18n?.[inputLocale] || (locale === 'vi' ? dto.description : undefined)
        const shortDescription = dto.shortDescriptionI18n?.[inputLocale] || (locale === 'vi' ? dto.shortDescription : undefined)

        if (!title?.trim()) return Promise.resolve(null)

        return this.prisma.courseTranslation.upsert({
          where: { courseId_locale: { courseId, locale } },
          update: {
            title: title.trim(),
            shortDescription: shortDescription?.trim() || null,
            description: description?.trim() || null,
          },
          create: {
            courseId,
            locale,
            title: title.trim(),
            shortDescription: shortDescription?.trim() || null,
            description: description?.trim() || null,
          },
        })
      }),
    )
  }
}
