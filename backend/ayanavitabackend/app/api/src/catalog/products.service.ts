import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'
import { UpsertProductAttributesDto, UpsertProductIngredientsDto } from './dto/product-metadata.dto'
import { normalizeBigInt } from './utils'
import { Prisma } from '@prisma/client'
import { ImageUploadService } from '../services/ImageUploadService'
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto'
import { ProductQueryDto } from './dto/product-query.dto'
type JsonValue = string | number | boolean | { [key: string]: JsonValue } | JsonValue[];
type ProductTranslationCreateManyRow = Prisma.ProductTranslationCreateManyInput

const normalizeSlug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');

const dedupeSlugInPayload = (rows: ProductTranslationCreateManyRow[]): ProductTranslationCreateManyRow[] => {
  const counters = new Map<string, number>();
  return rows.map((row) => {
    const key = `${row.languageCode}::${row.slug}`;
    const count = counters.get(key) ?? 0;
    counters.set(key, count + 1);
    if (count === 0) return row;
    return { ...row, slug: `${row.slug}-${count + 1}` };
  });
};

const toProductTranslationCreateManyData = (
  productId: number,
  translations: CreateProductDto['translations'] | UpdateProductDto['translations'],
) =>
  (translations ?? []).map((translation): ProductTranslationCreateManyRow => ({
    productId: BigInt(productId),
    languageCode: translation.languageCode,
    name: translation.name,
    slug: normalizeSlug(translation.slug || `${translation.languageCode}-${productId}`),
    shortDescription: translation.shortDescription,
    description: translation.description,
    guideContent: translation.guideContent
      ? (JSON.parse(JSON.stringify(translation.guideContent)) as JsonValue)
      : null,
  }))

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  private async makeUniqueTranslationSlugs(
    tx: Prisma.TransactionClient,
    rows: ReturnType<typeof toProductTranslationCreateManyData>,
    productId?: number,
  ) {
    const dedupedRows = dedupeSlugInPayload(rows);
    const output: typeof dedupedRows = [];
    const usedSlugByLang = new Set<string>();

    const languages = Array.from(new Set(dedupedRows.map((row) => row.languageCode)));
    if (languages.length) {
      const existingRows = await tx.productTranslation.findMany({
        where: {
          languageCode: { in: languages },
          ...(productId ? { productId: { not: BigInt(productId) } } : {}),
        },
        select: { languageCode: true, slug: true },
      });

      for (const existing of existingRows) {
        usedSlugByLang.add(`${existing.languageCode}::${existing.slug}`);
      }
    }

    for (const row of dedupedRows) {
      const baseSlug = row.slug || `${row.languageCode}-${Date.now()}`;
      let candidate = baseSlug;
      let suffix = 1;
      while (usedSlugByLang.has(`${row.languageCode}::${candidate}`)) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
      }

      usedSlugByLang.add(`${row.languageCode}::${candidate}`);
      output.push({ ...row, slug: candidate });
    }

    return output;
  }

  async findAll(query: ProductQueryDto = {}) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 10, 100)
    const skip = (page - 1) * pageSize

    const where: Prisma.CatalogProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: BigInt(query.categoryId) } : {}),
      ...(query.search
        ? {
            OR: [
              { sku: { contains: query.search } },
              {
                translations: {
                  some: {
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
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.catalogProduct.findMany({
        where,
        include: { translations: true, category: true, images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.catalogProduct.count({ where }),
    ])

    return normalizeBigInt({
      items: rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  }

  async findOne(id: number) {
    const row = await this.prisma.catalogProduct.findUnique({
      where: { id: BigInt(id) },
      include: {
        translations: true,
        category: true,
        attributes: true,
        ingredients: true,
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
      },
    })
    if (!row) throw new NotFoundException('Product not found')
    return normalizeBigInt(row)
  }

  async create(dto: CreateProductDto) {
    const row = await this.prisma.$transaction(async (tx) => {
      const createdProduct = await tx.catalogProduct.create({
        data: {
          sku: dto.sku,
          categoryId: dto.categoryId ? BigInt(dto.categoryId) : null,
          price: dto.price,
          status: dto.status ?? 'active',
        },
      })

      const translationRows = await this.makeUniqueTranslationSlugs(
        tx,
        toProductTranslationCreateManyData(Number(createdProduct.id), dto.translations),
      )
      await tx.productTranslation.createMany({ data: translationRows })

      return tx.catalogProduct.findUniqueOrThrow({
        where: { id: createdProduct.id },
        include: { translations: true, category: true },
      })
    })

    return normalizeBigInt(row)
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id)
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        const translationRows = await this.makeUniqueTranslationSlugs(
          tx,
          toProductTranslationCreateManyData(id, dto.translations),
          id,
        )
        await tx.productTranslation.deleteMany({ where: { productId: BigInt(id) } })
        await tx.productTranslation.createMany({ data: translationRows })
      }

      return tx.catalogProduct.update({
        where: { id: BigInt(id) },
        data: {
          sku: dto.sku,
          categoryId: dto.categoryId === undefined ? undefined : dto.categoryId === null ? null : BigInt(dto.categoryId),
          price: dto.price,
          status: dto.status,
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

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const images = await tx.productImage.findMany({ where: { productId: BigInt(id) } })

        for (const image of images) {
          await this.imageUploadService.deleteImage({ url: image.imageUrl })
        }

        await tx.productImage.deleteMany({ where: { productId: BigInt(id) } })
        return tx.catalogProduct.delete({ where: { id: BigInt(id) } })
      })

      return normalizeBigInt(row)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Không thể xóa sản phẩm do đang được tham chiếu dữ liệu khác. Vui lòng tắt trạng thái hoạt động trước.')
      }
      throw error
    }
  }

  async listImages(id: number) {
    await this.findOne(id)
    const rows = await this.prisma.productImage.findMany({
      where: { productId: BigInt(id) },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    })
    return normalizeBigInt(rows)
  }

  async createImage(id: number, dto: CreateProductImageDto) {
    await this.findOne(id)
    const created = await this.prisma.productImage.create({
      data: {
        productId: BigInt(id),
        imageUrl: dto.imageUrl,
        isPrimary: dto.isPrimary ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    })
    return normalizeBigInt(created)
  }

  async updateImage(id: number, imageId: number, dto: UpdateProductImageDto) {
    await this.findOne(id)
    const existing = await this.prisma.productImage.findFirst({
      where: { id: BigInt(imageId), productId: BigInt(id) },
    })
    if (!existing) throw new NotFoundException('Product image not found')

    if (dto.imageUrl && dto.imageUrl !== existing.imageUrl) {
      await this.imageUploadService.deleteImage({ url: existing.imageUrl })
    }

    const updated = await this.prisma.productImage.update({
      where: { id: BigInt(imageId) },
      data: {
        imageUrl: dto.imageUrl,
        isPrimary: dto.isPrimary,
        sortOrder: dto.sortOrder,
      },
    })

    return normalizeBigInt(updated)
  }

  async removeImage(id: number, imageId: number) {
    await this.findOne(id)
    const existing = await this.prisma.productImage.findFirst({
      where: { id: BigInt(imageId), productId: BigInt(id) },
    })
    if (!existing) throw new NotFoundException('Product image not found')

    await this.imageUploadService.deleteImage({ url: existing.imageUrl })
    const deleted = await this.prisma.productImage.delete({ where: { id: BigInt(imageId) } })
    return normalizeBigInt(deleted)
  }
}
