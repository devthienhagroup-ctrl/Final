import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { RestoreDto } from "./dto/restore.dto";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { CmsAdminService } from "./cms-admin.service";
import { AccessTokenGuard } from "../../auth/guards/access-token.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImageUploadService } from "../../services/ImageUploadService";
import { AdminListContactInquiriesDto } from "./dto/admin-list-contact-inquiries.dto";
import { ReplyContactInquiryDto } from "./dto/reply-contact-inquiry.dto";
import { CurrentUser, JwtUser } from "../../auth/decorators/current-user.decorator";

@Controller("admin/cms")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class CmsAdminController {
  constructor(
    private readonly svc: CmsAdminService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  @Permissions("cms.read")
  @Get("pages")
  listPages() {
    return this.svc.listPages();
  }

  @Permissions("cms.read")
  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.svc.getPageBySlug(slug);
  }

  @Permissions("cms.write")
  @Put("sections/:id/draft")
  saveDraft(
    @Param("id") id: string,
    @Query("locale") locale: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.svc.saveDraft(Number(id), locale, dto.draftData, dto.note, undefined);
  }

  @Permissions("cms.write")
  @Post("images/upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.imageUploadService.uploadImage(file);
  }

  @Permissions("cms.write")
  @Delete("images")
  deleteImage(@Body("url") url?: string, @Body("fileName") fileName?: string) {
    return this.imageUploadService.deleteImage({ url, fileName });
  }

  @Permissions("cms.publish")
  @Post("sections/:id/publish")
  publish(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.publish(Number(id), locale, undefined);
  }

  @Permissions("cms.publish")
  @Post("sections/:id/unpublish")
  unpublish(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.unpublish(Number(id), locale);
  }

  @Permissions("cms.read")
  @Get("sections/:id/versions")
  versions(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.listVersions(Number(id), locale);
  }

  @Permissions("cms.write")
  @Post("sections/:id/restore")
  restore(@Param("id") id: string, @Query("locale") locale: string, @Body() dto: RestoreDto) {
    return this.svc.restoreDraft(Number(id), locale, dto.versionId, undefined);
  }

  @Permissions("cms.read")
  @Get("contacts")
  listContactInquiries(@Query() query: AdminListContactInquiriesDto) {
    return this.svc.listContactInquiries(query);
  }

  @Permissions("cms.write")
  @Post("contacts/:id/reply")
  replyContactInquiry(
    @Param("id") id: string,
    @Body() dto: ReplyContactInquiryDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.replyContactInquiry(Number(id), dto, user);
  }
}
