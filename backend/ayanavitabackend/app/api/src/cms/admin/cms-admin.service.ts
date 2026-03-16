import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CmsLocale, CmsStatus, Prisma } from "@prisma/client";
import { AdminListContactInquiriesDto } from "./dto/admin-list-contact-inquiries.dto";
import { ReplyContactInquiryDto } from "./dto/reply-contact-inquiry.dto";
import { CmsPublicService } from "../public/cms-public.service";

@Injectable()
export class CmsAdminService {
  private readonly logger = new Logger(CmsAdminService.name);

  constructor(
    private prisma: PrismaService,
    private cmsPublicService: CmsPublicService,
  ) {}

  private parseLocale(localeStr: string): CmsLocale {
    const v = String(localeStr ?? "").toLowerCase();
    if (v === "vi" || v === "en" || v === "de") return v as CmsLocale;
    throw new BadRequestException("locale must be vi|en|de");
  }

  async listPages() {
    return this.prisma.cmsPage.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, title: true, isActive: true, updatedAt: true },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: { locales: true },
        },
      },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async saveDraft(
    sectionId: number,
    localeStr: string,
    draftData: any,
    note: string | undefined,
    userId?: number,
  ) {
    const locale = this.parseLocale(localeStr);

    const section = await this.prisma.cmsSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException("Section not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.cmsSectionLocale.upsert({
        where: { sectionId_locale: { sectionId, locale } },
        update: { draftData, status: CmsStatus.DRAFT },
        create: { sectionId, locale, draftData, status: CmsStatus.DRAFT },
      });

      await tx.cmsSectionVersion.create({
        data: {
          sectionId,
          locale,
          status: CmsStatus.DRAFT,
          data: draftData ?? {},
          note: note || null,
          createdBy: userId ?? null,
        },
      });
    });

    return { ok: true };
  }

  async publish(sectionId: number, localeStr: string, userId?: number) {
    const locale = this.parseLocale(localeStr);

    const row = await this.prisma.cmsSectionLocale.findUnique({
      where: { sectionId_locale: { sectionId, locale } },
    });
    if (!row) throw new NotFoundException("Section locale not found");

    const draft = row.draftData ?? {};

    await this.prisma.$transaction(async (tx) => {
      await tx.cmsSectionLocale.update({
        where: { sectionId_locale: { sectionId, locale } },
        data: { publishedData: draft, publishedAt: new Date(), status: CmsStatus.PUBLISHED },
      });

      await tx.cmsSectionVersion.create({
        data: {
          sectionId,
          locale,
          status: CmsStatus.PUBLISHED,
          data: draft,
          note: "publish",
          createdBy: userId ?? null,
        },
      });
    });

    return { ok: true };
  }

  async unpublish(sectionId: number, localeStr: string) {
    const locale = this.parseLocale(localeStr);

    await this.prisma.cmsSectionLocale.update({
      where: { sectionId_locale: { sectionId, locale } },
      data: { status: CmsStatus.DRAFT },
    });

    return { ok: true };
  }

  async listVersions(sectionId: number, localeStr: string) {
    const locale = this.parseLocale(localeStr);

    return this.prisma.cmsSectionVersion.findMany({
      where: { sectionId, locale },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async restoreDraft(
    sectionId: number,
    localeStr: string,
    versionId: number,
    userId?: number,
  ) {
    const locale = this.parseLocale(localeStr);

    const v = await this.prisma.cmsSectionVersion.findFirst({
      where: { id: versionId, sectionId, locale },
    });
    if (!v) throw new NotFoundException("Version not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.cmsSectionLocale.upsert({
        where: { sectionId_locale: { sectionId, locale } },
        update: { draftData: v.data, status: CmsStatus.DRAFT },
        create: { sectionId, locale, draftData: v.data, status: CmsStatus.DRAFT },
      });

      await tx.cmsSectionVersion.create({
        data: {
          sectionId,
          locale,
          status: CmsStatus.DRAFT,
          data: v.data,
          note: `restore:${versionId}`,
          createdBy: userId ?? null,
        },
      });
    });

    return { ok: true };
  }

  async listContactInquiries(query: AdminListContactInquiriesDto) {
    const where: Prisma.ContactInquiryWhereInput = {};

    if (query.status) where.status = query.status;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { need: { contains: q } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      };
    }

    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          replies: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
      this.prisma.contactInquiry.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async replyContactInquiry(inquiryId: number, dto: ReplyContactInquiryDto, actor?: { sub?: number; email?: string }) {
    const inquiry = await this.prisma.contactInquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new NotFoundException("Contact inquiry not found");

    const toEmail = dto.toEmail?.trim().toLowerCase() || inquiry.email || null;
    if (!toEmail) {
      throw new BadRequestException("Inquiry has no email. Please provide toEmail to send reply.");
    }

    await this.cmsPublicService.sendSmtpViaGmail({
      to: toEmail,
      subject: dto.subject,
      body: dto.content,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.contactInquiryReply.create({
        data: {
          inquiryId,
          userId: actor?.sub ? Number(actor.sub) : null,
          staffEmail: actor?.email || null,
          subject: dto.subject,
          content: dto.content,
        },
      });

      await tx.contactInquiry.update({
        where: { id: inquiryId },
        data: {
          status: "replied",
          repliedAt: new Date(),
        },
      });
    });

    this.logger.log(`Inquiry #${inquiryId} replied by ${actor?.email || "unknown"}`);
    return { ok: true };
  }
}
