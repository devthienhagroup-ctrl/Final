import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CmsLocale, CmsStatus } from "@prisma/client";

@Injectable()
export class CmsPublicService {
  constructor(private prisma: PrismaService) {}

  private parseLocale(lang: string): CmsLocale {
  const v = String(lang ?? "").toLowerCase();
  if (v === "vi" || v === "en" || v === "de") return v as CmsLocale;
  throw new BadRequestException("lang must be vi|en|de");
}

  /**
   * Fallback rule:
   * - request en -> fallback vi
   * - request vi -> fallback vi (no-op)
   */
  private getFallbackLocale(locale: CmsLocale): CmsLocale {
    return "vi";
  }

  private pickPublishedLocaleRow(
    rows: Array<{
      locale: CmsLocale;
      status: CmsStatus;
      publishedData: any;
      publishedAt: Date | null;
    }>,
    preferred: CmsLocale,
    fallback: CmsLocale,
  ) {
    // rows already filtered by status=PUBLISHED in query
    return (
      rows.find((r) => r.locale === preferred && r.publishedAt) ??
      rows.find((r) => r.locale === fallback && r.publishedAt) ??
      null
    );
  }

  async getPublishedPage(slug: string, lang: string) {
    const locale = this.parseLocale(lang);
    const fallbackLocale = this.getFallbackLocale(locale);

    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            locales: {
              where: {
                status: CmsStatus.PUBLISHED,
                locale: { in: [locale, fallbackLocale] },
              },
              select: {
                locale: true,
                status: true,
                publishedData: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException("Page not found");

    const sections = page.sections.map((s) => {
      const chosen = this.pickPublishedLocaleRow(s.locales ?? [], locale, fallbackLocale);

      return {
        id: s.id,
        key: s.key,
        sortOrder: s.sortOrder,
        data: chosen?.publishedData ?? null,
        publishedAt: chosen?.publishedAt ?? null,
        // nếu muốn debug locale đang được dùng, mở dòng dưới:
        // locale: chosen?.locale ?? null,
      };
    });

    return { slug: page.slug, title: page.title, sections };
  }

  async createLead(type: "book" | "talk", payload: any) {
    return this.prisma.publicLead.create({ data: { type, payload } });
  }
}
