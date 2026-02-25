import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIngredientKeyDto, UpdateIngredientKeyDto } from './dto/ingredient.dto'
import { normalizeBigInt } from './utils'

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.ingredientKey.findMany({
      include: { translations: true },
      orderBy: { id: 'desc' },
    })
    return normalizeBigInt(rows)
  }

  async findOne(id: number) {
    const row = await this.prisma.ingredientKey.findUnique({
      where: { id: BigInt(id) },
      include: { translations: true },
    })
    if (!row) throw new NotFoundException('Ingredient key not found')
    return normalizeBigInt(row)
  }

  async create(dto: CreateIngredientKeyDto) {
    const row = await this.prisma.ingredientKey.create({
      data: {
        code: dto.code,
        isActive: dto.isActive ?? true,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    })
    return normalizeBigInt(row)
  }

  async update(id: number, dto: UpdateIngredientKeyDto) {
    await this.findOne(id)
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        await tx.ingredientKeyTranslation.deleteMany({ where: { ingredientKeyId: BigInt(id) } })
      }

      return tx.ingredientKey.update({
        where: { id: BigInt(id) },
        data: {
          code: dto.code,
          isActive: dto.isActive,
          translations: dto.translations ? { create: dto.translations } : undefined,
        },
        include: { translations: true },
      })
    })
    return normalizeBigInt(row)
  }

  async remove(id: number) {
    await this.findOne(id)
    const row = await this.prisma.ingredientKey.delete({ where: { id: BigInt(id) } })
    return normalizeBigInt(row)
  }
}
