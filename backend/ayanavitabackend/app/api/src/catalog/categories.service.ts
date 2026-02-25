import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'
import { normalizeBigInt } from './utils'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.category.findMany({
      include: { translations: true },
      orderBy: { id: 'desc' },
    })
    return normalizeBigInt(rows)
  }

  async findOne(id: number) {
    const row = await this.prisma.category.findUnique({
      where: { id: BigInt(id) },
      include: { translations: true },
    })
    if (!row) throw new NotFoundException('Category not found')
    return normalizeBigInt(row)
  }

  async create(dto: CreateCategoryDto) {
    const row = await this.prisma.category.create({
      data: {
        parentId: dto.parentId ? BigInt(dto.parentId) : null,
        status: dto.status ?? 'active',
        translations: { create: dto.translations },
      },
      include: { translations: true },
    })
    return normalizeBigInt(row)
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id)

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        await tx.categoryTranslation.deleteMany({ where: { categoryId: BigInt(id) } })
      }

      return tx.category.update({
        where: { id: BigInt(id) },
        data: {
          parentId: dto.parentId === undefined ? undefined : dto.parentId === null ? null : BigInt(dto.parentId),
          status: dto.status,
          translations: dto.translations ? { create: dto.translations } : undefined,
        },
        include: { translations: true },
      })
    })

    return normalizeBigInt(row)
  }

  async remove(id: number) {
    await this.findOne(id)
    const row = await this.prisma.category.delete({ where: { id: BigInt(id) } })
    return normalizeBigInt(row)
  }
}
