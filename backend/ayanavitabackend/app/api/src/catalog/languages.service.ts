import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { normalizeBigInt } from './utils'

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
    return normalizeBigInt(rows)
  }
}
