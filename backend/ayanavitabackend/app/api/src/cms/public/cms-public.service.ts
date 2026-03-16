import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";import { PrismaService } from "../../prisma/prisma.service";
import { CmsLocale, CmsStatus } from "@prisma/client";
import * as tls from "tls";
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
      throw new HttpException(
          "Bạn gửi liên hệ quá nhanh. Vui lòng thử lại sau ít phút.",
          HttpStatus.TOO_MANY_REQUESTS,
      );    }
  }

  private async sendThankYouEmail(to: string, customerName: string) {
    const subject = "[AYANAVITA] Cảm ơn bạn đã liên hệ";
    const body = `Xin chào ${customerName},\n\nAYANAVITA đã nhận được thông tin liên hệ của bạn.\nNhân viên của chúng tôi sẽ liên hệ sớm nhất để tư vấn chi tiết cho quý khách.\n\nTrân trọng,\nĐội ngũ AYANAVITA`;
    await this.sendSmtpViaGmail({ to, subject, body });
  }

  async sendSmtpViaGmail(params: { to: string; subject: string; body: string }) {
    const user = process.env.MAIL_USER ?? "manage.ayanavita@gmail.com";
    const pass = process.env.MAIL_PASS ?? "";
    if (!pass) {
      this.logger.warn("MAIL_PASS is missing, skip sending email");
      return;
    }

    const { to, subject, body } = params;

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
        "Content-Type: text/plain; charset=UTF-8",
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
