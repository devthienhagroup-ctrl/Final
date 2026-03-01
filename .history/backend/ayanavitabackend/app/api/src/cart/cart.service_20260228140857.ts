import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CartStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto'
import { normalizeBigInt } from '../catalog/utils'

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            price: true,
            status: true,
            translations: {
              where: { languageCode: 'vi' },
              select: { name: true },
              take: 1,
            },
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
              select: { imageUrl: true },
              take: 1,
            },
          },
        }
      }
    }
  }
}>

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(cart: CartWithItems | null) {
    const items = (cart?.items ?? []).map((item) => ({
      itemId: item.id,
      productId: String(item.productId),
      name: item.nameSnapshot || item.product?.translations?.[0]?.name || item.product?.sku || '',
      price: item.priceSnapshot,
      quantity: item.quantity,
      image: item.product?.images?.[0]?.imageUrl ?? undefined,
    }))

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    return normalizeBigInt({
      cartId: cart?.id ?? null,
      items,
      subtotal,
      totalItems,
    })
  }

  private async ensureProduct(productId: number) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { id: BigInt(productId) },
      select: {
        id: true,
        sku: true,
        price: true,
        status: true,
        translations: {
          where: { languageCode: 'vi' },
          select: { name: true },
          take: 1,
        },
      },
    })

    if (!product || product.status !== 'active') {
      throw new NotFoundException('Product not found or inactive')
    }

    return product
  }

  private async getOrCreateActiveCart(userId: number) {
    const cart = await this.prisma.cart.findFirst({ where: { userId, status: CartStatus.ACTIVE }, select: { id: true } })
    if (cart) return cart

    return this.prisma.cart.create({
      data: { userId, status: CartStatus.ACTIVE, currency: 'VND' },
      select: { id: true },
    })
  }

  private async getActiveCart(userId: number) {
    return this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: {
        items: {
          orderBy: { id: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                price: true,
                status: true,
                translations: {
                  where: { languageCode: 'vi' },
                  select: { name: true },
                  take: 1,
                },
                images: {
                  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
                  select: { imageUrl: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })
  }

  async getMyCart(userId: number) {
    const cart = await this.getActiveCart(userId)
    return this.toResponse(cart)
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const qty = dto.quantity ?? 1
    if (!Number.isInteger(qty) || qty < 1) throw new BadRequestException('quantity must be >= 1')

    const product = await this.ensureProduct(dto.productId)
    const cart = await this.getOrCreateActiveCart(userId)

    await this.prisma.cartDetail.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: BigInt(dto.productId) } },
      create: {
        cartId: cart.id,
        productId: BigInt(dto.productId),
        quantity: qty,
        nameSnapshot: product.translations[0]?.name ?? product.sku,
        priceSnapshot: Number(product.price),
      },
      update: {
        quantity: { increment: qty },
        nameSnapshot: product.translations[0]?.name ?? product.sku,
        priceSnapshot: Number(product.price),
      },
    })

    const updated = await this.getActiveCart(userId)
    return this.toResponse(updated)
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    if (!Number.isInteger(dto.quantity)) throw new BadRequestException('quantity must be an integer')

    const item = await this.prisma.cartDetail.findUnique({
      where: { id: itemId },
      include: { cart: { select: { id: true, userId: true, status: true } } },
    })

    if (!item || item.cart.userId !== userId || item.cart.status !== CartStatus.ACTIVE) {
      throw new NotFoundException('Cart item not found')
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartDetail.delete({ where: { id: itemId } })
    } else {
      await this.prisma.cartDetail.update({ where: { id: itemId }, data: { quantity: dto.quantity } })
    }

    const updated = await this.getActiveCart(userId)
    return this.toResponse(updated)
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartDetail.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true, status: true } } },
    })

    if (!item || item.cart.userId !== userId || item.cart.status !== CartStatus.ACTIVE) {
      throw new NotFoundException('Cart item not found')
    }

    await this.prisma.cartDetail.delete({ where: { id: itemId } })
    const updated = await this.getActiveCart(userId)
    return this.toResponse(updated)
  }

  async mergeCart(userId: number, dto: MergeCartDto) {
    if (!dto.items?.length) {
      const cart = await this.getActiveCart(userId)
      return this.toResponse(cart)
    }

    const grouped = new Map<number, { quantity: number }>()
    for (const item of dto.items) {
      const prev = grouped.get(item.productId)
      grouped.set(item.productId, {
        quantity: (prev?.quantity ?? 0) + item.quantity,
      })
    }

    const cart = await this.getOrCreateActiveCart(userId)

    await this.prisma.$transaction(async (tx) => {
      for (const [productId, payload] of grouped.entries()) {
        const product = await tx.catalogProduct.findUnique({
          where: { id: BigInt(productId) },
          select: {
            id: true,
            sku: true,
            price: true,
            status: true,
            translations: {
              where: { languageCode: 'vi' },
              select: { name: true },
              take: 1,
            },
          },
        })

        if (!product || product.status !== 'active') continue

        await tx.cartDetail.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: BigInt(productId) } },
          create: {
            cartId: cart.id,
            productId: BigInt(productId),
            quantity: payload.quantity,
            nameSnapshot: product.translations[0]?.name ?? product.sku,
            priceSnapshot: Number(product.price),
          },
          update: {
            quantity: { increment: payload.quantity },
            nameSnapshot: product.translations[0]?.name ?? product.sku,
            priceSnapshot: Number(product.price),
          },
        })
      }
    })

    const updated = await this.getActiveCart(userId)
    return this.toResponse(updated)
  }
}
