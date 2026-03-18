import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CmsLocale, CmsStatus } from "@prisma/client";
import * as tls from "tls";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactInquiryDto } from "./dto/create-contact-inquiry.dto";

@Injectable()
export class CmsPublicService {
  private readonly logger = new Logger(CmsPublicService.name);
  private readonly spamWindowMs = Number(process.env.CONTACT_SPAM_WINDOW_MS ?? 10 * 60 * 1000);
  private readonly spamMaxPerWindow = Number(process.env.CONTACT_SPAM_MAX_PER_WINDOW ?? 5);

  constructor(private prisma: PrismaService) {}

  private parseLocale(lang: string): CmsLocale {
    const v = String(lang ?? "").toLowerCase();
    if (v === "vi" || v === "en" || v === "de") return v as CmsLocale;
    throw new BadRequestException("lang must be vi|en|de");
  }

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

    if (!page) {
      if (slug === "global") {
        return { slug: "global", title: "Global", sections: [] };
      }
      throw new NotFoundException("Page not found");
    }

    const sections = page.sections.map((s) => {
      const chosen = this.pickPublishedLocaleRow(s.locales ?? [], locale, fallbackLocale);

      return {
        id: s.id,
        key: s.key,
        sortOrder: s.sortOrder,
        data: chosen?.publishedData ?? null,
        publishedAt: chosen?.publishedAt ?? null,
      };
    });

    return { slug: page.slug, title: page.title, sections };
  }

  async createLead(type: "book" | "talk", payload: any) {
    return this.prisma.publicLead.create({ data: { type, payload } });
  }

  async createContactInquiry(payload: CreateContactInquiryDto, ipAddress: string, userAgent?: string | null) {
    const normalizedEmail = payload.email?.trim().toLowerCase() || null;
    const normalizedIp = String(ipAddress || "").trim() || "unknown";

    await this.checkSpamByIp(normalizedIp);

    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: normalizedEmail,
        need: payload.need?.trim() || null,
        note: payload.note?.trim() || null,
        ipAddress: normalizedIp,
        userAgent: userAgent?.slice(0, 500) || null,
      },
    });

    if (normalizedEmail) {
      void this.sendThankYouEmail(normalizedEmail, inquiry.name).catch((error) => {
        this.logger.error(`Failed to send contact thank-you email to ${normalizedEmail}`, error?.stack ?? String(error));
      });
    }

    return { ok: true, id: inquiry.id, message: "Gửi liên hệ thành công" };
  }

  private async checkSpamByIp(ipAddress: string) {
    const from = new Date(Date.now() - this.spamWindowMs);
    const count = await this.prisma.contactInquiry.count({
      where: {
        ipAddress,
        createdAt: { gte: from },
      },
    });

    if (count >= this.spamMaxPerWindow) {
      throw new HttpException("Bạn gửi liên hệ quá nhanh. Vui lòng thử lại sau ít phút.", HttpStatus.TOO_MANY_REQUESTS);
    }
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

  private async sendThankYouEmail(to: string, customerName: string) {
    const safeName = this.escapeHtml(customerName || "bạn");
    const subject = "AYANAVITA | Cảm ơn bạn đã liên hệ";
    const body = this.renderEmailShell({
      title: "Cảm ơn bạn đã liên hệ AYANAVITA",
      intro: "Chúng tôi đã nhận được thông tin của bạn và sẽ phản hồi trong thời gian sớm nhất.",
      contentHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#374151;">Xin chào <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#374151;">
          Cảm ơn bạn đã quan tâm và gửi liên hệ đến AYANAVITA. Đội ngũ của chúng tôi đã ghi nhận yêu cầu của bạn và sẽ sớm liên hệ để tư vấn chi tiết hơn.
        </p>
        <div style="margin:22px 0;padding:18px 20px;border-radius:16px;background:linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%);border:1px solid #fde68a;">
          <p style="margin:0;font-size:14px;line-height:1.8;color:#92400e;">
            Trong thời gian chờ phản hồi, bạn có thể giữ liên lạc qua chính email này nếu muốn bổ sung thêm nhu cầu hoặc thông tin cần hỗ trợ.
          </p>
        </div>
        <p style="margin:0;font-size:15px;line-height:1.8;color:#374151;">Chúc bạn một ngày thật an yên và nhiều năng lượng.</p>
      `,
    });

    await this.sendSmtpViaGmail({ to, subject, body, isHtml: true });
  }

  async sendSmtpViaGmail(params: { to: string; subject: string; body: string; isHtml?: boolean }) {
    const user = process.env.MAIL_USER ?? "manage.ayanavita@gmail.com";
    const pass = process.env.MAIL_PASS ?? "";
    if (!pass) {
      this.logger.warn("MAIL_PASS is missing, skip sending email");
      return;
    }

    const { to, subject, body, isHtml = false } = params;

    const readSmtpResponse = (socket: tls.TLSSocket) =>
        new Promise<string>((resolve, reject) => {
          let buffer = "";

          const cleanup = () => {
            socket.off("data", onData);
            socket.off("error", onError);
            socket.off("close", onClose);
          };

          const onError = (err: Error) => {
            cleanup();
            reject(err);
          };

          const onClose = () => {
            cleanup();
            reject(new Error("SMTP connection closed unexpectedly"));
          };

          const onData = (chunk: Buffer) => {
            buffer += chunk.toString("utf8");
            const normalized = buffer.replace(/\r\n/g, "\n");
            const lines = normalized.split("\n").filter(Boolean);
            if (lines.length === 0) return;
            const lastLine = lines[lines.length - 1];
            if (!/^\d{3} /.test(lastLine)) return;
            cleanup();
            resolve(normalized.trim());
          };

          socket.on("data", onData);
          socket.once("error", onError);
          socket.once("close", onClose);
        });

    const sendCommand = async (socket: tls.TLSSocket, command: string, expectedCodes: number[]) => {
      socket.write(`${command}\r\n`);
      const response = await readSmtpResponse(socket);
      const code = Number(response.slice(0, 3));
      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP command failed (${command}): ${response}`);
      }
      return response;
    };

    const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const client = tls.connect(465, "smtp.gmail.com", { servername: "smtp.gmail.com" }, () => resolve(client));
      client.once("error", reject);
    });

    try {
      const greeting = await readSmtpResponse(socket);
      if (!greeting.startsWith("220")) {
        throw new Error(`SMTP greeting failed: ${greeting}`);
      }

      await sendCommand(socket, "EHLO ayanavita.local", [250]);
      await sendCommand(socket, "AUTH LOGIN", [334]);
      await sendCommand(socket, Buffer.from(user).toString("base64"), [334]);
      await sendCommand(socket, Buffer.from(pass).toString("base64"), [235]);
      await sendCommand(socket, `MAIL FROM:<${user}>`, [250]);
      await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
      await sendCommand(socket, "DATA", [354]);

      const message = [
        `Subject: ${subject}`,
        `From: AYANAVITA <${user}>`,
        `To: ${to}`,
        "MIME-Version: 1.0",
        `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=UTF-8`,
        "Content-Transfer-Encoding: 8bit",
        "",
        body,
        ".",
      ].join("\r\n");
      socket.write(`${message}\r\n`);
      const dataResponse = await readSmtpResponse(socket);
      if (!dataResponse.startsWith("250")) {
        throw new Error(`SMTP send failed: ${dataResponse}`);
      }

      await sendCommand(socket, "QUIT", [221]);
    } finally {
      socket.end();
    }
  }
}
