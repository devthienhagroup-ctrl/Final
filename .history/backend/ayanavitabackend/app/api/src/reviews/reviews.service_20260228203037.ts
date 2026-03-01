import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ProductOrderStatus, ReviewType, ReviewVisibility } from '@prisma/client'
import type { Request } from 'express'
import { normalizeBigInt } from '../catalog/utils'
import { PrismaService } from '../prisma/prisma.service'
import { ImageUploadService } from '../services/ImageUploadService'
import { CreateReviewDto } from './dto/create-review.dto'
import { AdminReviewsQueryDto, PublicReviewsQueryDto } from './dto/reviews-query.dto'

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageUploadService: ImageUploadService,
    private readonly jwtService: JwtService,
  ) {}

  private getClientIp(req: Request) {
    const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    return xff || req.ip || null
  }

  private tryGetUserId(req: Request): number | null {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET }) as { sub?: number }
      return payload?.sub && Number.isInteger(payload.sub) ? payload.sub : null
    } catch {
      return null
    }
  }

  async listBranches() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true },
      orderBy: { id: 'asc' },
    })
  }

  async listServices(branchId?: number) {
    if (!branchId) {
      return this.prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      })
    }

    const rows = await this.prisma.branchService.findMany({
      where: { branchId, service: { isActive: true } },
      select: { service: { select: { id: true, name: true } } },
      orderBy: { serviceId: 'asc' },
    })
    return rows.map((x) => x.service)
  }

  async listMyReviewableProducts(userId: number, branchId?: number) {
    const orders = await this.prisma.productOrder.findMany({
      where: {
        userId,
        status: ProductOrderStatus.PAID,
      },
      select: {
        id: true,
        code: true,
        details: {
          select: {
            id: true,
            productId: true,
            productName: true,
            productSku: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    })

    const reviewed = await this.prisma.review.findMany({
      where: {
        userId,
        type: ReviewType.PRODUCT,
      },
      select: { productOrderId: true, productId: true },
    })

    const reviewedKey = new Set(
      reviewed
        .filter((x) => x.productOrderId && x.productId)
        .map((x) => `${x.productOrderId?.toString()}-${x.productId?.toString()}`),
    )

    return orders.flatMap((order) =>
      order.details.map((detail) => {
          const key = `${order.id.toString()}-${detail.productId.toString()}`
          return {
            orderId: order.id.toString(),
            orderCode: order.code,
            orderDetailId: detail.id.toString(),
            productId: detail.productId.toString(),
            productName: detail.productName,
            productSku: detail.productSku,
            reviewed: reviewedKey.has(key),
          }
        }),
    )
  }

  async createReview(dto: CreateReviewDto, req: Request, files: any[] = []) {
    const ipAddress = this.getClientIp(req)
    const userId = this.tryGetUserId(req)

    if (dto.type === ReviewType.SERVICE && ipAddress) {
      const since = new Date(Date.now() - 10 * 60 * 1000)
      const recentCount = await this.prisma.review.count({
        where: {
          type: ReviewType.SERVICE,
          ipAddress,
          createdAt: { gte: since },
        },
      })
      if (recentCount >= 5) {
        throw new ForbiddenException('IP này đã gửi quá nhiều đánh giá dịch vụ trong thời gian ngắn')
      }
    }

    if (dto.type === ReviewType.PRODUCT) {
      if (!userId) {
        throw new ForbiddenException('Đánh giá sản phẩm yêu cầu đăng nhập')
      }
      if (dto.anonymous) {
        throw new BadRequestException('Không thể đánh giá sản phẩm ẩn danh')
      }
      if (!dto.productId || !dto.productOrderId) {
        throw new BadRequestException('Thiếu productId hoặc productOrderId')
      }

      const detail = await this.prisma.productOrderDetail.findFirst({
        where: {
          productId: BigInt(dto.productId),
          orderId: BigInt(dto.productOrderId),
          order: {
            userId,
            status: ProductOrderStatus.PAID,
          },
        },
        select: { id: true },
      })

      if (!detail) {
        throw new ForbiddenException('Bạn chỉ có thể đánh giá sản phẩm đã mua thành công')
      }

      const exists = await this.prisma.review.findFirst({
        where: {
          type: ReviewType.PRODUCT,
          userId,
          productId: BigInt(dto.productId),
          productOrderId: BigInt(dto.productOrderId),
        },
      })

      if (exists) {
        throw new BadRequestException('Sản phẩm trong đơn hàng này đã được bạn đánh giá')
      }
    }

    if (dto.type === ReviewType.SERVICE && !dto.serviceId) {
      throw new BadRequestException('Thiếu serviceId cho đánh giá dịch vụ')
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId }, select: { id: true } })
    if (!branch) throw new NotFoundException('Branch not found')

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.review.create({
        data: {
          type: dto.type,
          branchId: dto.branchId,
          serviceId: dto.serviceId,
          productId: dto.productId ? BigInt(dto.productId) : undefined,
          productOrderId: dto.productOrderId ? BigInt(dto.productOrderId) : undefined,
          productOrderDetailId: dto.productOrderDetailId ? BigInt(dto.productOrderDetailId) : undefined,
          userId,
          isAnonymous: !!dto.anonymous,
          customerName: dto.customerName?.trim() || null,
          stars: dto.stars,
          comment: dto.comment.trim(),
          ipAddress,
          userAgent: req.headers['user-agent']?.toString().slice(0, 512) || null,
        },
      })

      if (files.length) {
        const uploaded = await Promise.all(files.map((file) => this.imageUploadService.uploadImage(file)))
        await tx.reviewImage.createMany({
          data: uploaded.map((img) => ({
            reviewId: row.id,
            fileName: img.fileName,
            imageUrl: img.url,
          })),
        })
      }

      return row
    })

    return normalizeBigInt(created)
  }

  async listPublic(query: PublicReviewsQueryDto) {
    const rows = await this.prisma.review.findMany({
      where: {
        visibility: ReviewVisibility.VISIBLE,
        ...(query.type ? { type: query.type } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
      },
      include: {
        images: true,
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
      take: 200,
    })

    return normalizeBigInt(rows)
  }

  async adminList(query: AdminReviewsQueryDto) {
    const rows = await this.prisma.review.findMany({
      where: {
        ...(query.type ? { type: query.type } : {}),
        ...(query.visibility ? { visibility: query.visibility } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.serviceId ? { serviceId: query.serviceId } : {}),
        ...(query.productId ? { productId: BigInt(query.productId) } : {}),
        ...(query.q
          ? {
              OR: [
                { comment: { contains: query.q } },
                { customerName: { contains: query.q } },
              ],
            }
          : {}),
      },
      include: {
        images: true,
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            sku: true,
            translations: { where: { languageCode: 'vi' }, select: { name: true }, take: 1 },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { id: 'desc' },
      take: 500,
    })

    return normalizeBigInt(rows)
  }

  async adminHide(id: number) {
    await this.prisma.review.update({ where: { id: BigInt(id) }, data: { visibility: ReviewVisibility.HIDDEN } })
    return { ok: true }
  }

  async adminDelete(id: number) {
    await this.prisma.review.update({ where: { id: BigInt(id) }, data: { visibility: ReviewVisibility.DELETED } })
    return { ok: true }
  }
}
