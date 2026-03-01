import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  Prisma,
  ProductOrderStatus,
  ProductPaymentMethod,
  ProductPaymentStatus,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { normalizeBigInt } from '../catalog/utils'
import { CheckoutPaymentMethod, CreateProductOrderDto } from './dto/create-product-order.dto'

@Injectable()
export class ProductOrdersService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(ProductOrdersService.name)


  private readonly bankInfo = {
    gateway: 'BIDV',
    accountNumber: '8810091561',
    accountName: 'LE MINH HIEU',
  }

  private readonly orderDetailsWithMainImage = {
    include: {
      product: {
        select: {
          images: {
            where: { isPrimary: true },
            select: { imageUrl: true },
            take: 1,
          },
        },
      },
    },
  } as const

  private mapOrderWithMainImage<T extends { details?: Array<any> }>(order: T) {
    return {
      ...order,
      details: (order.details ?? []).map((detail) => ({
        ...detail,
        productImage: detail.product?.images?.[0]?.imageUrl ?? null,
        product: undefined,
      })),
    }
  }

  private genOrderCode() {
    return `PORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  private genPaymentCode() {
    return `ORD_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  private buildTransferContent(paymentId: bigint) {
    return `ID${paymentId.toString()}ProductOrderPayment`
  }

  private toDecimal(value: number) {
    return new Prisma.Decimal(value.toFixed(2))
  }

  private async buildOrderPricing(items: CreateProductOrderDto['items']) {
    const ids = [...new Set(items.map((it) => it.productId))]
    const products = await this.prisma.catalogProduct.findMany({
      where: { id: { in: ids.map((id) => BigInt(id)) } },
      select: {
        id: true,
        sku: true,
        price: true,
        status: true,
        translations: { where: { languageCode: 'vi' }, select: { name: true }, take: 1 },
      },
    })

    const map = new Map(products.map((p) => [Number(p.id), p]))

    const details = items.map((item) => {
      const product = map.get(item.productId)
      if (!product || product.status !== 'active') {
        throw new BadRequestException(`Product ${item.productId} is unavailable`)
      }

      const unitPrice = Number(product.price)
      const lineTotal = unitPrice * item.qty

      return {
        productId: BigInt(item.productId),
        productSku: product.sku,
        productName: product.translations[0]?.name ?? product.sku,
        unitPrice: this.toDecimal(unitPrice),
        quantity: item.qty,
        lineTotal: this.toDecimal(lineTotal),
      }
    })

    const subtotalNum = details.reduce((sum, x) => sum + Number(x.lineTotal), 0)

    return {
      details,
      subtotal: this.toDecimal(subtotalNum),
      shippingFee: this.toDecimal(0),
      discount: this.toDecimal(0),
      total: this.toDecimal(subtotalNum),
    }
  }

  async create(userId: number, dto: CreateProductOrderDto) {
    const pricing = await this.buildOrderPricing(dto.items)
    const isCod = dto.paymentMethod === CheckoutPaymentMethod.COD
    const status = isCod ? ProductOrderStatus.PROCESSING : ProductOrderStatus.PENDING_PAYMENT
    const paymentMethod = isCod ? ProductPaymentMethod.COD : ProductPaymentMethod.SEPAY
    const paymentStatus = isCod ? ProductPaymentStatus.NOT_REQUIRED : ProductPaymentStatus.PENDING
    const paymentCode = isCod ? null : this.genPaymentCode()

    const { order, deletedCartItems, transferContent } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productOrder.create({
        data: {
          code: this.genOrderCode(),
          userId,
          status,
          paymentMethod,
          paymentStatus,
          paymentCode,
          receiverName: dto.shipping.receiverName,
          receiverPhone: dto.shipping.phone,
          receiverEmail: dto.shipping.email,
          shippingAddress: dto.shipping.addressLine,
          district: dto.shipping.district,
          city: dto.shipping.city,
          note: dto.shipping.note,
          subtotal: pricing.subtotal,
          shippingFee: pricing.shippingFee,
          discount: pricing.discount,
          total: pricing.total,
          currency: 'VND',
          expiresAt: isCod ? null : new Date(Date.now() + 15 * 60 * 1000),
          details: {
            create: pricing.details,
          },
        },
        include: {
          details: true,
        },
      })

      let createdTransferContent: string | null = null
      if (!isCod && paymentCode) {
        const createdPayment = await tx.productOrderPayment.create({
          data: {
            orderId: created.id,
            provider: 'SEPAY',
            status: ProductPaymentStatus.PENDING,
            amount: created.total,
            transferCode: paymentCode,
            tranferContent: `TMP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            expiredAt: created.expiresAt ?? undefined,
            rawResponse: {
              accountName: this.bankInfo.accountName,
              accountNumber: this.bankInfo.accountNumber,
              bankName: this.bankInfo.gateway,
              bankCode: this.bankInfo.gateway,
              transferContent: paymentCode,
            },
          },
        })

        createdTransferContent = this.buildTransferContent(createdPayment.id)

        await tx.productOrderPayment.update({
          where: { id: createdPayment.id },
          data: {
            tranferContent: createdTransferContent,
            rawResponse: {
              accountName: this.bankInfo.accountName,
              accountNumber: this.bankInfo.accountNumber,
              bankName: this.bankInfo.gateway,
              bankCode: this.bankInfo.gateway,
              transferContent: createdTransferContent,
            },
          },
        })

        await tx.productOrder.update({
          where: { id: created.id },
          data: { paymentCode: createdTransferContent },
        })
      }

      const activeCarts = await tx.cart.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { id: true },
      })

      const deleted = await tx.cartDetail.deleteMany({
        where: {
          cartId: { in: activeCarts.map((cart) => cart.id) },
          productId: { in: pricing.details.map((detail) => detail.productId) },
        },
      })

      return {
        order: created,
        deletedCartItems: deleted.count,
        transferContent: createdTransferContent,
      }
    })

    this.logger.log(
      `Đã xóa ${deletedCartItems} sản phẩm trong giỏ hàng sau khi tạo đơn thành công (orderId=${order.id}, userId=${userId})`,
    )

    const finalTransferContent = transferContent ?? order.paymentCode
    const sepayInfo = !isCod
      ? {
          webhookUrl: '/hooks/sepay-payment',
          amount: Number(order.total),
          accountName: this.bankInfo.accountName,
          accountNumber: this.bankInfo.accountNumber,
          bankName: this.bankInfo.gateway,
          bankCode: this.bankInfo.gateway,
          transferContent: finalTransferContent,
          qrUrl: `https://qr.sepay.vn/img?acc=${this.bankInfo.accountNumber}&bank=${this.bankInfo.gateway}&des=${finalTransferContent}&amount=${Number(order.total)}`,
        }
      : null

    return normalizeBigInt({
      order: {
        ...order,
        paymentCode: finalTransferContent,
      },
      sepay: sepayInfo,
      pollUrl: `/api/product-orders/${order.id}`,
      socketEvent: 'order_paid',
    })
  }

  async myOrders(userId: number) {
    const orders = await this.prisma.productOrder.findMany({
      where: { userId },
      include: { details: this.orderDetailsWithMainImage },
      orderBy: { id: 'desc' },
    })
    return normalizeBigInt(orders.map((order) => this.mapOrderWithMainImage(order)))
  }

  async myOrderDetail(userId: number, orderId: number) {
    const order = await this.prisma.productOrder.findFirst({
      where: { id: BigInt(orderId), userId },
      include: {
        details: this.orderDetailsWithMainImage,
        payments: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    })
    if (!order) throw new NotFoundException('Order not found')
    return normalizeBigInt(this.mapOrderWithMainImage(order))
  }

  async adminList(params: { status?: string; q?: string }) {
    const statusRaw = (params.status ?? '').trim()
    const q = (params.q ?? '').trim()

    const status = statusRaw && Object.values(ProductOrderStatus).includes(statusRaw as ProductOrderStatus)
      ? (statusRaw as ProductOrderStatus)
      : undefined

    const qNum = Number(q)
    const qIsNum = q.length > 0 && Number.isFinite(qNum)

    const OR: Prisma.ProductOrderWhereInput[] = []
    if (q) {
      if (qIsNum) {
        OR.push({ id: BigInt(qNum) })
        OR.push({ userId: qNum })
      }
      OR.push({ code: { contains: q } })
      OR.push({ receiverName: { contains: q } })
      OR.push({ receiverPhone: { contains: q } })
      OR.push({ paymentCode: { contains: q } })
      OR.push({ details: { some: { productName: { contains: q } } } })
    }

    const where: Prisma.ProductOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(OR.length ? { OR } : {}),
    }

    const data = await this.prisma.productOrder.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        details: this.orderDetailsWithMainImage,
      },
      orderBy: { id: 'desc' },
      take: 200,
    })

    return normalizeBigInt(data.map((order) => this.mapOrderWithMainImage(order)))
  }

  async adminUpdateStatus(orderId: number, status: ProductOrderStatus) {
    const order = await this.prisma.productOrder.findUnique({ where: { id: BigInt(orderId) } })
    if (!order) throw new NotFoundException('Order not found')

    const paymentStatus = status === ProductOrderStatus.PAID
      ? ProductPaymentStatus.PAID
      : status === ProductOrderStatus.CANCELLED
        ? ProductPaymentStatus.FAILED
        : order.paymentStatus

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.productOrder.update({
        where: { id: BigInt(orderId) },
        data: {
          status,
          paymentStatus,
          paidAt: status === ProductOrderStatus.PAID ? new Date() : order.paidAt,
          cancelledAt: status === ProductOrderStatus.CANCELLED ? new Date() : order.cancelledAt,
        },
        include: { details: true },
      })

      if (order.paymentMethod === ProductPaymentMethod.SEPAY) {
        await tx.productOrderPayment.updateMany({
          where: { orderId: BigInt(orderId), status: ProductPaymentStatus.PENDING },
          data: {
            status: paymentStatus,
            paidAt: status === ProductOrderStatus.PAID ? new Date() : undefined,
          },
        })
      }

      return next
    })

    return normalizeBigInt(updated)
  }

  async markPaid(orderId: number) {
    return this.adminUpdateStatus(orderId, ProductOrderStatus.PAID)
  }
}
