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

  private escapeHtml(value: string) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
  }

  private nl2br(value: string) {
    return this.escapeHtml(value).replace(/\r?\n/g, "<br />");
  }

  private renderEmailShell(params: { title: string; intro?: string; contentHtml: string; footerNote?: string }) {
    const { title, intro, contentHtml, footerNote } = params;

    return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:28px 16px;">
      <div style="max-width:640px;margin:0 auto;">
        <div style="color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">AYANAVITA</div>
        <div style="color:rgba(255,255,255,0.9);font-size:13px;margin-top:6px;">Wellness Experience</div>
      </div>
    </div>

    <div style="max-width:640px;margin:0 auto;padding:24px 16px 40px;">
      <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 35px rgba(31,41,55,0.08);border:1px solid #eef2ff;">
        <div style="padding:32px 28px 20px;">
          <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#eef2ff;color:#4F46E5;font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
            AYANAVITA Care
          </div>
          <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.3;color:#111827;">${this.escapeHtml(title)}</h1>
          ${intro ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#4b5563;">${this.escapeHtml(intro)}</p>` : ""}
          ${contentHtml}
        </div>

        <div style="padding:0 28px 28px;">
          <div style="margin-top:28px;padding:18px 20px;border-radius:16px;background:#faf5ff;border:1px solid #ede9fe;">
            <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
              ${this.escapeHtml(
        footerNote ??
        "Nếu bạn cần hỗ trợ thêm, bạn chỉ cần phản hồi lại email này. Đội ngũ AYANAVITA luôn sẵn sàng đồng hành cùng bạn.",
    )}
            </p>
          </div>
        </div>
      </div>

      <div style="text-align:center;padding:20px 12px 0;color:#9ca3af;font-size:12px;line-height:1.7;">
        Trân trọng,<br />
        <strong style="color:#6b7280;">Đội ngũ AYANAVITA</strong>
      </div>
    </div>
  </body>
</html>`;
  }

  private renderContactReplyEmail(params: {
    customerName?: string | null;
    subject: string;
    content: string;
    staffEmail?: string | null;
  }) {
    const { customerName, subject, content, staffEmail } = params;
    const safeName = this.escapeHtml(customerName?.trim() || "bạn");
    const safeStaffEmail = staffEmail?.trim() ? this.escapeHtml(staffEmail.trim()) : null;

    return this.renderEmailShell({
      title: subject,
      intro: "AYANAVITA đã gửi phản hồi đến yêu cầu liên hệ của bạn.",
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#374151;">Xin chào <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#374151;">
          Cảm ơn bạn đã liên hệ với AYANAVITA. Dưới đây là nội dung phản hồi từ đội ngũ của chúng tôi:
        </p>
        <div style="margin:22px 0;padding:20px;border-radius:16px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:inset 0 0 0 1px #f9fafb;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">Nội dung phản hồi</div>
          <div style="font-size:15px;line-height:1.8;color:#374151;">${this.nl2br(content)}</div>
        </div>
        <p style="margin:0;font-size:15px;line-height:1.8;color:#374151;">Chúc bạn một ngày thật an yên và nhiều năng lượng.</p>
      `,
    });
  }

  private buildContactInquiryWhere(query: AdminListContactInquiriesDto): Prisma.ContactInquiryWhereInput {
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

    return where;
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
    const where = this.buildContactInquiryWhere(query);

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

  async contactInquiryStats(query: AdminListContactInquiriesDto) {
    const where = this.buildContactInquiryWhere(query);

    const [total, newCount, repliedCount, emailCount, noteCount, replyCount] = await this.prisma.$transaction([
      this.prisma.contactInquiry.count({ where }),
      this.prisma.contactInquiry.count({ where: { ...where, status: "new" } }),
      this.prisma.contactInquiry.count({ where: { ...where, status: "replied" } }),
      this.prisma.contactInquiry.count({ where: { ...where, email: { not: null } } }),
      this.prisma.contactInquiry.count({ where: { ...where, note: { not: null } } }),
      this.prisma.contactInquiryReply.count({ where: { inquiry: where } }),
    ]);

    const fmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - idx));
      return d;
    });

    const trendChart = await Promise.all(
        days.map(async (day) => {
          const start = new Date(day);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          const value = await this.prisma.contactInquiry.count({
            where: {
              ...where,
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          });

          return {
            label: fmt.format(day),
            value,
          };
        }),
    );

    return {
      overview: {
        total,
        newCount,
        repliedCount,
        emailCount,
        noteCount,
        replyCount,
      },
      statusChart: [
        { label: "Mới", value: newCount },
        { label: "Đã phản hồi", value: repliedCount },
        { label: "Có email", value: emailCount },
        { label: "Có ghi chú", value: noteCount },
      ],
      trendChart,
    };
  }

  async replyContactInquiry(inquiryId: number, dto: ReplyContactInquiryDto, actor?: { sub?: number; email?: string }) {
    const inquiry = await this.prisma.contactInquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new NotFoundException("Contact inquiry not found");

    const toEmail = dto.toEmail?.trim().toLowerCase() || inquiry.email || null;
    if (!toEmail) {
      throw new BadRequestException("Inquiry has no email. Please provide toEmail to send reply.");
    }

    const htmlBody = this.renderContactReplyEmail({
      customerName: inquiry.name,
      subject: dto.subject,
      content: dto.content,
      staffEmail: actor?.email || null,
    });

    await this.cmsPublicService.sendSmtpViaGmail({
      to: toEmail,
      subject: dto.subject,
      body: htmlBody,
      isHtml: true,
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
