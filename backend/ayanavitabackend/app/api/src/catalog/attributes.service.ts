import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAttributeKeyDto, UpdateAttributeKeyDto } from './dto/attribute.dto'
import { normalizeBigInt } from './utils'

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.attributeKey.findMany({
      include: { translations: true },
      orderBy: { id: 'desc' },
    })
    return normalizeBigInt(rows)
  }

  async findOne(id: number) {
    const row = await this.prisma.attributeKey.findUnique({
      where: { id: BigInt(id) },
      include: { translations: true },
    })
    if (!row) throw new NotFoundException('Attribute key not found')
    return normalizeBigInt(row)
  }

  async create(dto: CreateAttributeKeyDto) {
    const row = await this.prisma.attributeKey.create({
      data: {
        code: dto.code,
        valueType: dto.valueType ?? 'text',
        isActive: dto.isActive ?? true,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    })
    return normalizeBigInt(row)
  }

  async update(id: number, dto: UpdateAttributeKeyDto) {
    await this.findOne(id)
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        await tx.attributeKeyTranslation.deleteMany({ where: { attributeKeyId: BigInt(id) } })
      }

      return tx.attributeKey.update({
        where: { id: BigInt(id) },
        data: {
          code: dto.code,
          valueType: dto.valueType,
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
    const row = await this.prisma.attributeKey.delete({ where: { id: BigInt(id) } })
    return normalizeBigInt(row)
  }
}
