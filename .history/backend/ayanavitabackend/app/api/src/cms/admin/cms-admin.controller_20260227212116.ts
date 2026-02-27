import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { RestoreDto } from "./dto/restore.dto";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { CmsAdminService } from "./cms-admin.service";
import { Role } from "@prisma/client";
import { AccessTokenGuard } from "../../auth/guards/access-token.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImageUploadService } from "../../services/ImageUploadService";

@Controller("admin/cms")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.ADMIN) // hoặc @Roles("ADMIN")
export class CmsAdminController {
  constructor(
    private readonly svc: CmsAdminService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  @Get("pages")
  listPages() {
    return this.svc.listPages();
  }

  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.svc.getPageBySlug(slug);
  }

  @Put("sections/:id/draft")
  saveDraft(
    @Param("id") id: string,
    @Query("locale") locale: string,
    @Body() dto: SaveDraftDto,
  ) {
    // userId: nếu bạn có current-user decorator thì truyền vào ở đây
    return this.svc.saveDraft(Number(id), locale, dto.draftData, dto.note, undefined);
  }


  @Post("images/upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.imageUploadService.uploadImage(file);
  }

  @Delete("images")
  deleteImage(@Body("url") url?: string, @Body("fileName") fileName?: string) {
    return this.imageUploadService.deleteImage({ url, fileName });
  }

  @Post("sections/:id/publish")
  publish(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.publish(Number(id), locale, undefined);
  }

  @Post("sections/:id/unpublish")
  unpublish(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.unpublish(Number(id), locale);
  }

  @Get("sections/:id/versions")
  versions(@Param("id") id: string, @Query("locale") locale: string) {
    return this.svc.listVersions(Number(id), locale);
  }

  @Post("sections/:id/restore")
  restore(@Param("id") id: string, @Query("locale") locale: string, @Body() dto: RestoreDto) {
    return this.svc.restoreDraft(Number(id), locale, dto.versionId, undefined);
  }
}
