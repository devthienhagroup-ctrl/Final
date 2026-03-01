import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { BlogPostStatus } from '@prisma/client'
import type { Request } from 'express'
import { JwtUser } from '../auth/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { ImageUploadService } from '../services/ImageUploadService'
import { BlogQueryDto, BlogSortMode } from './dto/blog-query.dto'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { UpdateBlogPostDto } from './dto/update-blog-post.dto'

@Injectable()
export class BlogService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer?: NodeJS.Timeout

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => {
      void this.clearExpiredViewTrackers()
    }, 60 * 60 * 1000)
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }

  private slugify(text: string) {
    return text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  private async makeUniqueSlug(title: string, excludeId?: number) {
    const base = this.slugify(title)
    if (!base) throw new BadRequestException('Tiêu đề không hợp lệ để tạo slug')

    for (let i = 0; i < 20; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`
      const found = await this.prisma.blogPost.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
      if (!found) return slug
    }

    throw new BadRequestException('Không thể tạo slug duy nhất')
  }

  private getClientIp(req: Request) {
    const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    return xff || req.ip || '0.0.0.0'
  }

  async create(author: JwtUser, dto: CreateBlogPostDto, file?: any) {
    let coverImage = dto.coverImage?.trim() || null

    if (file) {
      const uploaded = await this.imageUploadService.uploadImage(file)
      coverImage = uploaded.url
    }

    const slug = await this.makeUniqueSlug(dto.title)
    const isPublished = dto.status === BlogPostStatus.PUBLISHED

    return this.prisma.blogPost.create({
      data: {
        authorId: author.sub,
        title: dto.title.trim(),
        slug,
        summary: dto.summary?.trim() || null,
        content: dto.content.trim(),
        coverImage,
        tags: dto.tags || [],
        status: dto.status || BlogPostStatus.DRAFT,
        publishedAt: isPublished ? new Date() : null,
      },
    })
  }

  async listPublic(query: BlogQueryDto) {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const skip = (page - 1) * pageSize

    const where = {
      status: BlogPostStatus.PUBLISHED,
...(query.tag ? { tags: { array_contains: [query.tag] } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { summary: { contains: query.q } },
              { content: { contains: query.q } },
            ],
          }
        : {}),
    }

    const orderBy = query.sort === BlogSortMode.POPULAR ? ({ views: 'desc' } as const) : ({ publishedAt: 'desc' } as const)

    const [total, items] = await this.prisma.$transaction([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: pageSize,
        include: { author: { select: { id: true, name: true } } },
        orderBy,
      }),
    ])

    return { page, pageSize, total, items }
  }

  async listAdmin(query: BlogQueryDto) {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const skip = (page - 1) * pageSize

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { summary: { contains: query.q } },
              { content: { contains: query.q } },
            ],
          }
        : {}),
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: pageSize,
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return { page, pageSize, total, items }
  }

  async detailPublic(id: number, req: Request) {
    const post = await this.prisma.blogPost.findFirst({
      where: { id, status: BlogPostStatus.PUBLISHED },
      include: { author: { select: { id: true, name: true } } },
    })
    if (!post) throw new NotFoundException('Blog không tồn tại')

    const ipAddress = this.getClientIp(req)
    const now = new Date()
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)

    const tracker = await this.prisma.blogViewTracker.findUnique({
      where: {
        blogId_ipAddress: {
          blogId: id,
          ipAddress,
        },
      },
    })

    if (!tracker) {
      await this.prisma.$transaction([
        this.prisma.blogPost.update({
          where: { id },
          data: { views: { increment: 1 } },
        }),
        this.prisma.blogViewTracker.create({
          data: {
            blogId: id,
            ipAddress,
            lastViewedAt: now,
            lastCountedAt: now,
          },
        }),
      ])
    } else {
      const shouldCount = tracker.lastCountedAt < twelveHoursAgo
      await this.prisma.$transaction([
        this.prisma.blogViewTracker.update({
          where: { id: tracker.id },
          data: {
            lastViewedAt: now,
            ...(shouldCount ? { lastCountedAt: now } : {}),
          },
        }),
        ...(shouldCount
          ? [
              this.prisma.blogPost.update({
                where: { id },
                data: { views: { increment: 1 } },
              }),
            ]
          : []),
      ])
    }

    return this.prisma.blogPost.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    })
  }

  async update(id: number, dto: UpdateBlogPostDto, file?: any) {
    const current = await this.prisma.blogPost.findUnique({ where: { id } })
    if (!current) throw new NotFoundException('Blog không tồn tại')

    let coverImage = dto.coverImage?.trim() || current.coverImage || null
    if (file) {
      const uploaded = await this.imageUploadService.uploadImage(file)
      coverImage = uploaded.url
    }

    const nextTitle = dto.title?.trim()
    const nextStatus = dto.status || current.status

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: nextTitle,
        slug: nextTitle ? await this.makeUniqueSlug(nextTitle, id) : undefined,
        summary: dto.summary?.trim(),
        content: dto.content?.trim(),
        coverImage,
        tags: dto.tags,
        status: nextStatus,
        publishedAt: nextStatus === BlogPostStatus.PUBLISHED ? current.publishedAt || new Date() : null,
      },
    })
  }

  async remove(id: number) {
    await this.prisma.blogPost.delete({ where: { id } })
    return { ok: true }
  }

  async toggleSave(userId: number, blogId: number) {
    const post = await this.prisma.blogPost.findUnique({ where: { id: blogId }, select: { id: true } })
    if (!post) throw new NotFoundException('Blog không tồn tại')

    const existing = await this.prisma.blogSavedPost.findUnique({
      where: { userId_blogId: { userId, blogId } },
      select: { id: true },
    })

    if (existing) {
      await this.prisma.blogSavedPost.delete({ where: { userId_blogId: { userId, blogId } } })
      return { saved: false }
    }

    await this.prisma.blogSavedPost.create({ data: { userId, blogId } })
    return { saved: true }
  }

  async mySaved(userId: number) {
    return this.prisma.blogSavedPost.findMany({
      where: { userId },
      include: { blog: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async mergeSaved(userId: number, blogIds: number[]) {
    const ids = Array.from(new Set((blogIds || []).filter((id) => Number.isInteger(id) && id > 0)))
    if (!ids.length) return { merged: 0 }

    const posts = await this.prisma.blogPost.findMany({ where: { id: { in: ids } }, select: { id: true } })
    const validIds = posts.map((item) => item.id)

    if (!validIds.length) return { merged: 0 }

    const res = await this.prisma.blogSavedPost.createMany({
      data: validIds.map((blogId) => ({ userId, blogId })),
      skipDuplicates: true,
    })

    return { merged: res.count }
  }

  async clearExpiredViewTrackers() {
    const expireAt = new Date(Date.now() - 12 * 60 * 60 * 1000)
    await this.prisma.blogViewTracker.deleteMany({
      where: {
        lastViewedAt: { lt: expireAt },
      },
    })
  }

  async triggerCleanup(user: JwtUser) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Không có quyền')
    await this.clearExpiredViewTrackers()
    return { ok: true }
  }
}
