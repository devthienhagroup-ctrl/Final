import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EnrollmentStatus, Prisma, Role } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type JwtUser = { sub: number; role: Role | string }

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}
  // ... các hàm hiện có của bạn giữ nguyên

  /**
   * GET /me/enrollments?status=ACTIVE|CANCELED|ALL
   * - Mặc định: ACTIVE
   * - Trả kèm course + order để đối soát "đã trả (PAID) / đã cấp quyền (ACTIVE) / đã hủy (CANCELED)"
   */
    async myEnrollments(
    userId: number,
    status?: EnrollmentStatus | 'ALL',
  ) {
    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    return this.prisma.enrollment.findMany({
      where,
      select: {
        id: true,
        userId: true,
        courseId: true,
        orderId: true,
        status: true,
        enrolledAt: true,
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
        order: {
          select: {
            id: true,
            code: true,
            status: true,  // PENDING/PAID/...
            currency: true,
            subtotal: true,
            discount: true,
            total: true,
            paidAt: true,      // nếu bạn đã set trong mark-paid thì sẽ có
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })
  }
  /**
   * Tạo enrollment ACTIVE cho user + course.
   * LƯU Ý: Schema Enrollment của bạn bắt buộc orderId => enroll() phải nhận orderId.
   */
  async enroll(userId: number, courseId: number, orderId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    })
    if (!course) throw new NotFoundException('Course not found')

    try {
      return await this.prisma.enrollment.create({
        data: {
          user: { connect: { id: userId } },
          course: { connect: { id: courseId } },
          order: { connect: { id: orderId } }, // BẮT BUỘC theo schema
          status: EnrollmentStatus.ACTIVE,
        },
        select: {
          id: true,
          userId: true,
          courseId: true,
          orderId: true,
          status: true,
          enrolledAt: true,
          updatedAt: true,
        },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ForbiddenException('Already enrolled')
      }
      throw e
    }
  }

  /**
   * Danh sách khóa học user đã enroll (ACTIVE) + metadata
   */
  myCourses(userId: number) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: EnrollmentStatus.ACTIVE },
      select: {
        id: true, // enrollmentId
        status: true,
        enrolledAt: true,
        orderId: true,
        course: {
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
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })
  }

  /**
   * Danh sách khóa học + progress % (completedLessons/totalLessons)
   *
   * Quy tắc:
   * - USER: chỉ tính trên lessons published=true
   * - ADMIN: tính trên tất cả lessons
   */
  async myCoursesWithProgress(user: JwtUser) {
    const userId = user.sub
    const isAdmin = user.role === 'ADMIN'
    const enrollments = await this.myCourses(userId)

    if (enrollments.length === 0) return []

    const completed = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        status: 'COMPLETED',
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

    const courseIds = enrollments.map((e) => e.course.id)
    const totals = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
      },
      _count: { _all: true },
    })
    const totalByCourse = new Map<number, number>(totals.map((t) => [t.courseId, t._count._all]))

    return enrollments.map((e) => {
      const totalLessons = totalByCourse.get(e.course.id) || 0
      const completedLessons = completedCountByCourse.get(e.course.id) || 0
      const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

      return {
        enrollmentId: e.id,
        enrolledAt: e.enrolledAt,
        status: e.status,
        orderId: e.orderId,
        course: e.course,
        progress: { totalLessons, completedLessons, percent },
      }
    })
  }

  async cancel(userId: number, courseId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true },
    })
    if (!enrollment) throw new NotFoundException('Enrollment not found')

    return this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: EnrollmentStatus.CANCELED },
      select: { id: true, status: true, updatedAt: true },
    })
  }

  /**
   * Gate: chỉ cho xem lesson nếu đã enroll (hoặc admin)
   */
  async assertEnrolledOrAdmin(user: JwtUser, courseId: number) {
    if (user.role === 'ADMIN') return

    const e = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.sub, courseId } },
      select: { status: true },
    })

    if (!e || e.status !== EnrollmentStatus.ACTIVE) throw new ForbiddenException('Not enrolled')
  }
}
