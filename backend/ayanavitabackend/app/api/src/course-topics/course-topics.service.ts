import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCourseTopicDto } from './dto/create-course-topic.dto'
import { UpdateCourseTopicDto } from './dto/update-course-topic.dto'

@Injectable()
export class CourseTopicsService {
  private readonly supportedLocales = ['vi', 'en', 'de'] as const

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const topics = await this.prisma.courseTopic.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: { select: { courses: true } },
        translations: true,
      },
    })

    return topics.map((item) => ({
      ...item,
      translations: this.toTranslationMap(item.translations),
    }))
  }

  async create(dto: CreateCourseTopicDto) {
    const created = await this.prisma.courseTopic.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    })

    await this.upsertTopicTranslations(created.id, dto.translations)

    return this.findById(created.id)
  }

  async update(id: number, dto: UpdateCourseTopicDto) {
    await this.ensureExists(id)

    await this.prisma.courseTopic.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    })

    await this.upsertTopicTranslations(id, dto.translations)

    return this.findById(id)
  }

  async remove(id: number) {
    await this.ensureExists(id)
    try {
      return await this.prisma.courseTopic.delete({ where: { id }, select: { id: true } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Chỉ được xóa chủ đề khi không có khóa học nào thuộc chủ đề này.')
      }
      throw error
    }
  }

  private async findById(id: number) {
    const item = await this.prisma.courseTopic.findUnique({
      where: { id },
      include: {
        _count: { select: { courses: true } },
        translations: true,
      },
    })
    if (!item) throw new NotFoundException('Không tìm thấy chủ đề khóa học.')

    return {
      ...item,
      translations: this.toTranslationMap(item.translations),
    }
  }

  private toTranslationMap(rows: Array<{ locale: string; name: string; description: string | null }>) {
    return rows.reduce<Record<string, { name: string; description: string | null }>>((acc, row) => {
      acc[row.locale] = {
        name: row.name,
        description: row.description,
      }
      return acc
    }, {})
  }

  private async upsertTopicTranslations(topicId: number, input: CreateCourseTopicDto['translations']) {
    if (!input || typeof input !== 'object') return

    for (const locale of this.supportedLocales) {
      const row = input[locale]
      if (!row || typeof row !== 'object') continue
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) continue

      await this.prisma.courseTopicTranslation.upsert({
        where: { topicId_locale: { topicId, locale } },
        create: {
          topicId,
          locale,
          name,
          description: typeof row.description === 'string' ? row.description.trim() || null : null,
        },
        update: {
          name,
          description: typeof row.description === 'string' ? row.description.trim() || null : null,
        },
      })
    }
  }

  private async ensureExists(id: number) {
    const item = await this.prisma.courseTopic.findUnique({ where: { id }, select: { id: true } })
    if (!item) throw new NotFoundException('Không tìm thấy chủ đề khóa học.')
  }
}
