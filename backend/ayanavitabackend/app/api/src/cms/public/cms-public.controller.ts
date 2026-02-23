import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CmsPublicService } from "./cms-public.service";

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
}
