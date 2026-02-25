import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'
import { UpsertProductAttributesDto, UpsertProductIngredientsDto } from './dto/product-metadata.dto'
import { normalizeBigInt } from './utils'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.catalogProduct.findMany({
      include: { translations: true, category: true },
      orderBy: { id: 'desc' },
    })
    return normalizeBigInt(rows)
  }

  async findOne(id: number) {
    const row = await this.prisma.catalogProduct.findUnique({
      where: { id: BigInt(id) },
      include: { translations: true, category: true, attributes: true, ingredients: true },
    })
    if (!row) throw new NotFoundException('Product not found')
    return normalizeBigInt(row)
  }

  async create(dto: CreateProductDto) {
    const row = await this.prisma.catalogProduct.create({
      data: {
        sku: dto.sku,
        categoryId: dto.categoryId ? BigInt(dto.categoryId) : null,
        price: dto.price,
        status: dto.status ?? 'active',
        translations: { create: dto.translations },
      },
      include: { translations: true, category: true },
    })
    return normalizeBigInt(row)
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id)
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        await tx.productTranslation.deleteMany({ where: { productId: BigInt(id) } })
      }

      return tx.catalogProduct.update({
        where: { id: BigInt(id) },
        data: {
          sku: dto.sku,
          categoryId: dto.categoryId === undefined ? undefined : dto.categoryId === null ? null : BigInt(dto.categoryId),
          price: dto.price,
          status: dto.status,
          translations: dto.translations ? { create: dto.translations } : undefined,
        },
        include: { translations: true, category: true },
      })
    })
    return normalizeBigInt(row)
  }

  async replaceAttributes(id: number, dto: UpsertProductAttributesDto) {
    await this.findOne(id)
    const rows = await this.prisma.$transaction(async (tx) => {
      await tx.productAttribute.deleteMany({ where: { productId: BigInt(id) } })
      if (dto.items.length) {
        await tx.productAttribute.createMany({
          data: dto.items.map((item) => ({
            productId: BigInt(id),
            attributeKeyId: BigInt(item.attributeKeyId),
            valueText: item.valueText,
            valueNumber: item.valueNumber,
            valueBoolean: item.valueBoolean,
            valueJson: item.valueJson,
          })),
        })
      }
      return tx.productAttribute.findMany({ where: { productId: BigInt(id) } })
    })
    return normalizeBigInt(rows)
  }

  async replaceIngredients(id: number, dto: UpsertProductIngredientsDto) {
    await this.findOne(id)
    const rows = await this.prisma.$transaction(async (tx) => {
      await tx.productIngredient.deleteMany({ where: { productId: BigInt(id) } })
      if (dto.items.length) {
        await tx.productIngredient.createMany({
          data: dto.items.map((item) => ({
            productId: BigInt(id),
            ingredientKeyId: BigInt(item.ingredientKeyId),
            value: item.value,
            note: item.note,
            sortOrder: item.sortOrder ?? 0,
          })),
        })
      }
      return tx.productIngredient.findMany({ where: { productId: BigInt(id) }, orderBy: { sortOrder: 'asc' } })
    })
    return normalizeBigInt(rows)
  }

  async remove(id: number) {
    await this.findOne(id)
    const row = await this.prisma.catalogProduct.delete({ where: { id: BigInt(id) } })
    return normalizeBigInt(row)
  }
}
