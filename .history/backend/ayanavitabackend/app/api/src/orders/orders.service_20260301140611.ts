import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import {
  CourseAccessStatus,
  OrderStatus,
  Prisma,
  ProductOrderStatus,
  ProductPaymentStatus,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sepayKeyHash =
      process.env.SEPAY_WEBHOOK_KEY_HASH ?? '$2b$10$9dcVYk0jeiF76U84AzpCM.sixhaI/bEi/vQMKYvrW5sF1WhTEGDSy'

  // Bank nhận tiền
  private readonly bankInfo = {
    gateway: 'BIDV',
    accountNumber: '8810091561',
    accountName: 'LE MINH HIEU',
  }

  private genOrderCode() {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  // Nội dung chuyển khoản sẽ nhét vào QR: RQA:<email>::<slug>
  // (encodeURIComponent để an toàn ký tự)
  private buildSepayCode(email: string, courseSlug: string) {
    return `RQA:${encodeURIComponent(email)}::${encodeURIComponent(courseSlug)}`
  }

  // Parse được dù ngân hàng thêm chữ trước/sau vì mình match theo pattern có RQA:
  private parseSepayCode(content?: string | null): { email: string; courseSlug: string } | null {
    if (!content) return null

    const matched = content.match(/RQA:([A-Za-z0-9._%+\-]+)::([A-Za-z0-9._%+\-]+)/i)
    if (!matched) return null

    try {
      const email = decodeURIComponent(matched[1]).trim().toLowerCase()
      const courseSlug = decodeURIComponent(matched[2]).trim().toLowerCase()
      if (!email || !courseSlug) return null
      return { email, courseSlug }
    } catch {
      return null
    }
  }


  private buildProductTransferContent(paymentId: bigint) {
    return `ID${paymentId.toString()}ProductOrderPayment`
  }

  private parseProductTransferContent(content?: string | null): bigint | null {
    if (!content) return null

    const matched = content.match(/ID(\d+)ProductOrderPayment/i)
    if (!matched?.[1]) return null

    try {
      return BigInt(matched[1])
    } catch {
      return null
    }
  }

  private withSepayMeta(
      order: { id: number; status: OrderStatus; total: number; createdAt: Date },
      email: string,
      courseSlug: string,
  ) {
    return {
      ...order,
      payment: {
        provider: 'SEPAY',
        webhookUrl: '/hooks/sepay-payment',
        bank: this.bankInfo,
        transferContent: this.buildSepayCode(email, courseSlug),
      },
    }
  }

  async assertWebhookKey(rawKey?: string) {
    const token = (rawKey ?? '').trim()
    if (!token) throw new UnauthorizedException('Missing SePay webhook key')

    const ok = await bcrypt.compare(token, this.sepayKeyHash)
    if (!ok) throw new UnauthorizedException('Invalid SePay webhook key')
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
      select: { id: true, title: true, price: true, published: true, slug: true },
    })
    if (!course) throw new NotFoundException('Course not found')
    if (!course.published) throw new ForbiddenException('Course not published')

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (!user) throw new NotFoundException('User not found')

    const existingAccess = await this.prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    })
    if (existingAccess?.status === CourseAccessStatus.ACTIVE) {
      throw new ForbiddenException('Already enrolled')
    }

    // FREE course: auto enroll
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

    // Nếu đã có pending order thì trả lại để dùng lại QR/nội dung
    const pending = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PENDING,
        items: { some: { courseId } },
      },
      select: { id: true, status: true, total: true, createdAt: true },
      orderBy: { id: 'desc' },
    })
    if (pending) return this.withSepayMeta(pending, user.email, course.slug)

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
      },
    })

    return this.withSepayMeta(order, user.email, course.slug)
  }

  async handleSepayWebhook(payload: any) {
    // 1) chỉ nhận tiền vào
    if (String(payload?.transferType || '').toLowerCase() !== 'in') {
      return { ok: true, ignored: true, message: 'Ignore transferType != in' }
    }

    // 2) verify đúng ngân hàng + đúng STK (chống fake webhook)
    if (
      String(payload?.gateway || '').toUpperCase() !== this.bankInfo.gateway ||
      String(payload?.accountNumber || '') !== this.bankInfo.accountNumber
    ) {
      throw new ForbiddenException('Invalid bank account information')
    }

    const content = String(payload?.content || '')
    const productPaymentId = this.parseProductTransferContent(content)
    if (productPaymentId) {
      return this.handleProductOrderWebhook(payload, productPaymentId)
    }

    return this.handleCourseOrderWebhook(payload, content)
  }

  private async handleCourseOrderWebhook(payload: any, content: string) {
    // parse content để ra email + courseSlug
    const parsed = this.parseSepayCode(content)
    if (!parsed) {
      return { ok: true, ignored: true, message: 'Missing supported transfer code in content' }
    }

    const user = await this.prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true },
    })
    if (!user) throw new NotFoundException('User not found from SePay content')

    const course = await this.prisma.course.findUnique({
      where: { slug: parsed.courseSlug },
      select: { id: true },
    })
    if (!course) throw new NotFoundException('Course not found from SePay content')

    const order = await this.prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: [OrderStatus.PENDING, OrderStatus.PAID] },
        items: { some: { courseId: course.id } },
      },
      select: { id: true, status: true, total: true },
      orderBy: { id: 'desc' },
    })
    if (!order) throw new NotFoundException('Order not found for SePay webhook')

    // tiền chuyển phải đủ
    const transferAmount = Number(payload?.transferAmount ?? 0)
    if (!Number.isFinite(transferAmount) || transferAmount < (order.total ?? 0)) {
      throw new ForbiddenException('Transfer amount is not enough for this order')
    }

    const paid = await this.markPaid(order.id)

    if (paid?.alreadyPaid) {
      return { ok: true, alreadyPaid: true, orderId: order.id, message: 'Order already paid' }
    }

    return {
      ok: true,
      message: 'Thanh toán SePay thành công, đã kích hoạt khóa học',
      orderId: order.id,
      paid,
    }
  }

  private async handleProductOrderWebhook(payload: any, paymentId: bigint) {
    const payment = await this.prisma.productOrderPayment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            paymentMethod: true,
          },
        },
      },
    })

    if (!payment) throw new NotFoundException('Product order payment not found')
    if (payment.tranferContent !== this.buildProductTransferContent(payment.id)) {
      throw new ForbiddenException('Invalid transfer content for product payment')
    }

    const transferAmount = Number(payload?.transferAmount ?? 0)
    if (!Number.isFinite(transferAmount) || transferAmount < Number(payment.order.total ?? 0)) {
      throw new ForbiddenException('Transfer amount is not enough for this order')
    }

    if (payment.status === ProductPaymentStatus.PAID || payment.order.status === ProductOrderStatus.PAID) {
      return { ok: true, alreadyPaid: true, orderId: payment.order.id.toString(), paymentId: payment.id.toString() }
    }

    const paidAt = new Date()
    await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.productOrderPayment.updateMany({
        where: { id: payment.id, status: ProductPaymentStatus.PENDING },
        data: {
          status: ProductPaymentStatus.PAID,
          paidAt,
          rawResponse: payload,
        },
      })

      if (updatedPayment.count === 0) return

      await tx.productOrder.updateMany({
        where: { id: payment.orderId, status: ProductOrderStatus.PENDING_PAYMENT },
        data: {
          status: ProductOrderStatus.PAID,
          paymentStatus: ProductPaymentStatus.PAID,
          paidAt,
        },
      })
    })

    return {
      ok: true,
      message: 'Thanh toán SePay sản phẩm thành công',
      orderId: payment.order.id.toString(),
      paymentId: payment.id.toString(),
    }
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
      // idempotent: chỉ update nếu đang PENDING
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PAID },
      })
      if (updated.count === 0) {
        // có thể webhook bắn lại, order đã PAID bởi request khác
        return { ok: true, alreadyPaid: true }
      }

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
        orderId,
        enrolledCourses: order.items.map((i) => i.courseId),
      }
    })
  }
}