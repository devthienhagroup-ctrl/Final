import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { CmsPublicService } from "./cms-public.service";
import { CreateContactInquiryDto } from "./dto/create-contact-inquiry.dto";
import type { Request } from "express";

@Controller("public")
export class CmsPublicController {
  constructor(private svc: CmsPublicService) {}

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string, @Query("lang") lang = "vi") {
    return this.svc.getPublishedPage(slug, lang);
  }

  @Post("leads/book")
  book(@Body() body: any) {
    return this.svc.createLead("book", body);
  }

  @Post("leads/talk")
  talk(@Body() body: any) {
    return this.svc.createLead("talk", body);
  }

  @Post("contact-inquiries")
  createContactInquiry(@Body() dto: CreateContactInquiryDto, @Req() req: Request) {
    const xff = req.headers["x-forwarded-for"];
    const forwarded = Array.isArray(xff) ? xff[0] : (xff ?? "");
    const ipAddress = String(forwarded || req.ip || req.socket.remoteAddress || "unknown")
      .split(",")[0]
      .trim();
    const userAgent = req.headers["user-agent"] ? String(req.headers["user-agent"]) : null;

    return this.svc.createContactInquiry(dto, ipAddress, userAgent);
  }
}
