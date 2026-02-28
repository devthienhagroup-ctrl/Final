import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseAccessStatus, OrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private genOrderCode() {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  // ADMIN: list orders cho UI Admin Orders (GET /orders)
  // Fix lỗi mode: 'insensitive' (MySQL không support mode trong Prisma contains)
  async list(params: { status?: string; q?: string }) {
    const statusRaw = (params.status ?? '').toString().trim()
    const q = (params.q ?? '').toString().trim()

    const status = statusRaw
      ? Object.values(OrderStatus).includes(statusRaw as OrderStatus)
        ? (statusRaw as OrderStatus)
        : undefined
      : undefined

    const qNum = Number(q)
    const qIsNum = q.length > 0 && Number.isFinite(qNum)

    const OR: Prisma.OrderWhereInput[] = []
    if (q) {
      if (qIsNum) {
        OR.push({ id: qNum })
        OR.push({ userId: qNum })
        OR.push({ items: { some: { courseId: qNum } } })
      }
      OR.push({ code: { contains: q } })
      OR.push({ user: { email: { contains: q } } })
      OR.push({ items: { some: { courseTitle: { contains: q } } } })
    }

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(OR.length ? { OR } : {}),
    }

    return this.prisma.order.findMany({
      where,
      select: {
        id: true,
        code: true,
        status: true,
        currency: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, name: true } },
        items: {
          select: {
            id: true,
            courseId: true,
            price: true,
            courseTitle: true,
            course: { select: { id: true, title: true, slug: true, price: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: 200,
    })
  }

  async createOrder(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, published: true },
    })
    if (!course) throw new NotFoundException('Course not found')
    if (!course.published) throw new ForbiddenException('Course not published')

    const existingAccess = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    })
    if (existingAccess?.status === CourseAccessStatus.ACTIVE) {
      throw new ForbiddenException('Already enrolled')
    }

    // FREE: tạo order PAID total=0 và ghi nhận quyền truy cập khóa học ở CourseAccess
    if ((course.price ?? 0) === 0) {
      const paid = await this.prisma.$transaction(async (tx) => {
        const paidOrder = await tx.order.create({
          data: {
            code: this.genOrderCode(),
            status: OrderStatus.PAID,
            currency: 'VND',
            subtotal: 0,
            discount: 0,
            total: 0,
            user: { connect: { id: userId } },
            items: {
              create: [
                {
                  courseId,
                  price: 0,
                  courseTitle: course.title ?? 'Untitled course',
                },
              ],
            },
          },
          select: { id: true },
        })

        await tx.courseAccess.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: { status: CourseAccessStatus.ACTIVE, grantedAt: new Date() },
          create: { userId, courseId, status: CourseAccessStatus.ACTIVE },
        })

        return paidOrder
      })

      return { mode: 'FREE', enrolled: true, orderId: paid.id }
    }

    // Nếu có order pending cho course này => trả lại order đó (tránh tạo trùng)
    const pending = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PENDING,
        items: { some: { courseId } },
      },
      select: { id: true, status: true, total: true, createdAt: true },
      orderBy: { id: 'desc' },
    })
    if (pending) return pending

    // Create order + item (PENDING)
    const order = await this.prisma.order.create({
      data: {
        code: this.genOrderCode(),
        status: OrderStatus.PENDING,
        currency: 'VND',
        subtotal: course.price ?? 0,
        discount: 0,
        total: course.price ?? 0,
        user: { connect: { id: userId } },
        items: {
          create: [
            {
              courseId,
              price: course.price ?? 0,
              courseTitle: course.title ?? 'Untitled course',
            },
          ],
        },
      },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { id: true, courseId: true, price: true, courseTitle: true } },
      },
    })

    return order
  }

  myOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        code: true,
        status: true,
        currency: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            courseId: true,
            price: true,
            courseTitle: true,
            course: { select: { id: true, title: true, slug: true, price: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    })
  }

  // ADMIN mark-paid (mock payment)
  async markPaid(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        items: { select: { courseId: true } },
      },
    })
    if (!order) throw new NotFoundException('Order not found')
    if (order.status === OrderStatus.PAID) return { ok: true, alreadyPaid: true }

    return this.prisma.$transaction(async (tx) => {
      const paidOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
        select: { id: true, status: true, updatedAt: true },
      })

      for (const item of order.items) {
        await tx.courseAccess.upsert({
          where: { userId_courseId: { userId: order.userId, courseId: item.courseId } },
          update: { status: CourseAccessStatus.ACTIVE, grantedAt: new Date() },
          create: {
            userId: order.userId,
            courseId: item.courseId,
            status: CourseAccessStatus.ACTIVE,
          },
        })
      }

      return {
        ok: true,
        order: paidOrder,
        enrolledCourses: order.items.map((i) => i.courseId),
      }
    })
  }
}
