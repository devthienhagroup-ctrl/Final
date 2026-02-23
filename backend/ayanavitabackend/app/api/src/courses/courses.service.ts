import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentsService } from "../enrollments/enrollments.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { Prisma, ProgressStatus } from "@prisma/client";

type JwtUser = { sub: number; role: string }
@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService
  ) {}
async lessonsOutline(user: JwtUser, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, published: true },
    })
    if (!course) throw new NotFoundException('Course not found')

    // USER không xem outline nếu course unpublished (ẩn 404)
    if (user.role !== 'ADMIN' && !course.published) {
      throw new NotFoundException('Course not found')
    }

    // USER chỉ thấy lesson published=true; ADMIN thấy hết
    const lessons = await this.prisma.lesson.findMany({
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

    return lessons
  }
  // =========================
  // PUBLIC/COMMON (đã login)
  // =========================
  findAll() {
    return this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { lessons: true } },
      },
      orderBy: { id: "desc" },
    });
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { lessons: true } },
      },
    });
    if (!course) throw new NotFoundException("Course not found");
    return course;
  }

  // =========================
  // ADMIN CRUD
  // =========================
  async create(dto: CreateCourseDto) {
    try {
      return await this.prisma.course.create({
        data: dto,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          price: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
      });
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
    return this.prisma.course.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.ensureCourseExists(id);
    return this.prisma.course.delete({
      where: { id },
      select: { id: true },
    });
  }

  async listLessons(user: { sub: number; role: string }, courseId: number) {
    // 1) course tồn tại
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, published: true },
    });
    if (!course) throw new NotFoundException("Course not found");

    // 2) Gate enroll (ADMIN bypass)
    await this.enrollments.assertEnrolledOrAdmin(user, courseId);

    // 3) USER không xem course unpublished (ẩn 404)
    if (user.role !== "ADMIN" && !course.published) {
      throw new NotFoundException("Course not found");
    }

    // 4) Lấy lessons theo quyền
    const lessons = await this.prisma.lesson.findMany({
      where: {
        courseId,
        ...(user.role === "ADMIN" ? {} : { published: true }),
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
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    // ADMIN: không lock
    if (user.role === "ADMIN") {
      return lessons.map((l) => ({
        ...l,
        locked: false,
        lockReason: null,
        progress: null,
      }));
    }

    // 5) USER: lấy progress của user cho các lesson trong course này
    const progressRows = await this.prisma.lessonProgress.findMany({
      where: {
        userId: user.sub,
        lessonId: { in: lessons.map((l) => l.id) },
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
    });

    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

    // 6) Sequential unlock
    let prevCompleted = true;

    const result = lessons.map((lesson, idx) => {
      const progress = progressMap.get(lesson.id) ?? null;

      const locked = idx === 0 ? false : prevCompleted === false;
      const lockReason = locked ? "PREV_NOT_COMPLETED" : null;

      prevCompleted = progress?.status === ProgressStatus.COMPLETED;

      return {
        ...lesson,
        locked,
        lockReason,
        progress,
      };
    });

    return result;
  }

  /**
   * ✅ NEW: Lesson detail (có content) + enforce sequential lock để không lách URL
   * GET /courses/:courseId/lessons/:lessonId
   */
  async getLessonDetail(user: { sub: number; role: string }, courseId: number, lessonId: number) {
    // 1) course tồn tại
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, published: true },
    });
    if (!course) throw new NotFoundException("Course not found");

    // 2) Gate enroll (ADMIN bypass)
    await this.enrollments.assertEnrolledOrAdmin(user, courseId);

    // 3) USER không xem course unpublished (ẩn 404)
    if (user.role !== "ADMIN" && !course.published) {
      throw new NotFoundException("Course not found");
    }

    // 4) Lấy lesson thuộc course
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
      select: {
        id: true,
        courseId: true,
        title: true,
        slug: true,
        content: true,
        videoUrl: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    // 5) USER không xem lesson unpublished (ẩn 404)
    if (user.role !== "ADMIN" && !lesson.published) {
      throw new NotFoundException("Lesson not found");
    }

    // 6) USER: enforce sequential lock
    if (user.role !== "ADMIN") {
      const orderedLessons = await this.prisma.lesson.findMany({
        where: { courseId, published: true },
        select: { id: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      const idx = orderedLessons.findIndex((l) => l.id === lessonId);
      if (idx < 0) throw new NotFoundException("Lesson not found");

      if (idx > 0) {
        const prevLessonId = orderedLessons[idx - 1].id;
        const prevProgress = await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: user.sub, lessonId: prevLessonId } },
          select: { status: true },
        });

        const unlocked = prevProgress?.status === ProgressStatus.COMPLETED;
        if (!unlocked) throw new ForbiddenException("Lesson locked");
      }
    }

    // 7) progress của lesson hiện tại
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.sub, lessonId } },
      select: {
        lessonId: true,
        status: true,
        percent: true,
        lastPositionSec: true,
        lastOpenedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    });

    return {
      ...lesson,
      progress: progress ?? null,
    };
  }

  // helper
  private async ensureCourseExists(id: number) {
    const ok = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ok) throw new NotFoundException("Course not found");
  }
}
