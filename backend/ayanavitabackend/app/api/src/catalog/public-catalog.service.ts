import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { normalizeBigInt } from './utils'
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto'

type SortType = NonNullable<PublicCatalogQueryDto['sort']>

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private getSortOrder(sort: SortType | undefined): Prisma.CatalogProductOrderByWithRelationInput[] {
    if (sort === 'priceAsc') return [{ price: 'asc' }, { id: 'desc' }]
    if (sort === 'priceDesc') return [{ price: 'desc' }, { id: 'desc' }]
    if (sort === 'nameAsc') return [{ translations: { _count: 'desc' } }, { id: 'desc' }]
    if (sort === 'nameDesc') return [{ translations: { _count: 'desc' } }, { id: 'desc' }]
    return [{ createdAt: 'desc' }, { id: 'desc' }]
  }

  private mapProduct(item: any, lang: string) {
    const translation = item.translations[0] ?? null
    const categoryTranslation = item.category?.translations?.[0] ?? null
    const primaryImage = item.images?.[0] ?? null

    const attributes = (item.attributes ?? []).map((x: any) => ({
      key: x.attributeKey?.code,
      name: x.attributeKey?.translations?.[0]?.displayName ?? x.attributeKey?.code,
      valueText: x.valueText,
      valueNumber: x.valueNumber,
      valueBoolean: x.valueBoolean,
      valueJson: x.valueJson,
    }))

    const ingredients = (item.ingredients ?? []).map((x: any) => ({
      key: x.ingredientKey?.code,
      name: x.ingredientKey?.translations?.[0]?.displayName ?? x.ingredientKey?.code,
      value: x.value,
      note: x.note,
      sortOrder: x.sortOrder,
    }))

    return {
      id: item.id,
      sku: item.sku,
      price: item.price,
      status: item.status,
      languageCode: translation?.languageCode ?? lang,
      name: translation?.name ?? item.sku,
      slug: translation?.slug ?? item.sku,
      shortDescription: translation?.shortDescription ?? null,
      description: translation?.description ?? null,
      guideContent: translation?.guideContent ?? null,
      category: item.category
        ? {
            id: item.category.id,
            name: categoryTranslation?.name ?? null,
            slug: categoryTranslation?.slug ?? null,
          }
        : null,
      image: primaryImage?.imageUrl ?? null,
      images: (item.images ?? []).map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      attributes,
      ingredients,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  }

  async list(query: PublicCatalogQueryDto, lang = 'vi') {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 12, 100)
    const skip = (page - 1) * pageSize

    const parsedCategoryIds = String(query.categoryIds || '')
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isInteger(x) && x > 0)

    const where: Prisma.CatalogProductWhereInput = {
      status: 'active',
      ...(parsedCategoryIds.length
        ? { categoryId: { in: parsedCategoryIds.map((id) => BigInt(id)) } }
        : query.categoryId
          ? { categoryId: BigInt(query.categoryId) }
          : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { sku: { contains: query.search } },
              {
                translations: {
                  some: {
                    languageCode: lang,
                    OR: [
                      { name: { contains: query.search } },
                      { shortDescription: { contains: query.search } },
                      { description: { contains: query.search } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      translations: {
        some: {
          languageCode: lang,
        },
      },
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.catalogProduct.findMany({
        where,
        include: {
          translations: { where: { languageCode: lang }, take: 1 },
          category: {
            include: {
              translations: { where: { languageCode: lang }, take: 1 },
            },
          },
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
        },
        orderBy: this.getSortOrder(query.sort),
        skip,
        take: pageSize,
      }),
      this.prisma.catalogProduct.count({ where }),
    ])

    const items = rows.map((item) => this.mapProduct(item, lang))

    if (query.sort === 'nameAsc') {
      items.sort((a, b) => String(a.name).localeCompare(String(b.name), lang))
    }

    if (query.sort === 'nameDesc') {
      items.sort((a, b) => String(b.name).localeCompare(String(a.name), lang))
    }

    return normalizeBigInt({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  }

  private getDetailInclude(lang: string): Prisma.CatalogProductInclude {
    return {
      translations: { where: { languageCode: lang }, take: 1 },
      category: {
        include: {
          translations: { where: { languageCode: lang }, take: 1 },
        },
      },
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
      attributes: {
        include: {
          attributeKey: {
            include: {
              translations: { where: { languageCode: lang }, take: 1 },
            },
          },
        },
      },
      ingredients: {
        include: {
          ingredientKey: {
            include: {
              translations: { where: { languageCode: lang }, take: 1 },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    }
  }

  private async buildDetailResponse(row: any, lang: string) {
    const mapped = this.mapProduct(row, lang)

    const relatedRows = await this.prisma.catalogProduct.findMany({
      where: {
        status: 'active',
        categoryId: row.categoryId,
        id: { not: row.id },
        translations: {
          some: { languageCode: lang },
        },
      },
      include: {
        translations: { where: { languageCode: lang }, take: 1 },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
    })

    const relatedProducts = relatedRows.map((item) => {
      const translation = item.translations[0] ?? null
      const primaryImage = item.images?.[0] ?? null
      return {
        id: item.id,
        sku: item.sku,
        slug: translation?.slug ?? item.sku,
        name: translation?.name ?? item.sku,
        price: item.price,
        image: primaryImage?.imageUrl ?? null,
      }
    })

    return normalizeBigInt({
      ...mapped,
      relatedProducts,
    })
  }

  async detailBySku(sku: string, lang = 'vi') {
    const row = await this.prisma.catalogProduct.findFirst({
      where: {
        sku,
        status: 'active',
        translations: {
          some: { languageCode: lang },
        },
      },
      include: this.getDetailInclude(lang),
    })

    if (!row) throw new NotFoundException('Product not found')
    return this.buildDetailResponse(row, lang)
  }

  async detailBySlug(slug: string, lang = 'vi') {
    const row = await this.prisma.catalogProduct.findFirst({
      where: {
        status: 'active',
        translations: {
          some: {
            languageCode: lang,
            slug,
          },
        },
      },
      include: this.getDetailInclude(lang),
    })

    if (!row) throw new NotFoundException('Product not found')
    return this.buildDetailResponse(row, lang)
  }
}
