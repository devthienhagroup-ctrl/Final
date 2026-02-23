import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLessonDto } from './dto/create-lesson.dto'
import { UpdateLessonDto } from './dto/update-lesson.dto'
import { EnrollmentsService } from '../enrollments/enrollments.service'
import { JwtUser } from '../auth/decorators/current-user.decorator'
import { ProgressStatus } from '@prisma/client'

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  // GET /lessons/:id  -> trả content (GATED)
  async findOne(user: JwtUser, id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        courseId: true,
        title: true,
        slug: true,
        order: true,
        published: true,
        content: true, // content bị gate ở đây
        videoUrl: true, // thêm nếu schema có field này
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    // Gate 1: phải enroll course của lesson (ADMIN bypass)
    await this.enrollments.assertEnrolledOrAdmin(user, lesson.courseId)

    // Gate 2: USER không xem lesson unpublished (ẩn bằng 404)
    if (user.role !== 'ADMIN' && !lesson.published) {
      throw new NotFoundException('Lesson not found')
    }

    // Gate 3: Sequential unlock (USER phải hoàn thành lesson trước)
    // ADMIN bypass
    if (user.role !== 'ADMIN') {
      // Lesson trước đó trong cùng course (published)
      // Tie-break bằng (order, id) để xử lý trường hợp order trùng nhau
      const prev = await this.prisma.lesson.findFirst({
        where: {
          courseId: lesson.courseId,
          published: true,
          OR: [
            { order: { lt: lesson.order ?? 0 } },
            { order: lesson.order ?? 0, id: { lt: lesson.id } },
          ],
        },
        select: { id: true },
        orderBy: [{ order: 'desc' }, { id: 'desc' }],
      })

      // Nếu có lesson trước => phải COMPLETED mới cho xem lesson hiện tại
      if (prev) {
        const prevProgress = await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: user.sub, lessonId: prev.id } },
          select: { status: true },
        })

        if (!prevProgress || prevProgress.status !== ProgressStatus.COMPLETED) {
          throw new ForbiddenException('Complete previous lesson first')
        }
      }
    }

    return lesson
  }

  // ADMIN: create lesson
  create(courseId: number, dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: { ...dto, courseId },
    })
  }

  // ADMIN: update lesson
  update(id: number, dto: UpdateLessonDto) {
    return this.prisma.lesson.update({ where: { id }, data: dto })
  }

  // ADMIN: delete lesson
  remove(id: number) {
    return this.prisma.lesson.delete({ where: { id } })
  }
}
