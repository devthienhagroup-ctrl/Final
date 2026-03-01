import { Module } from "@nestjs/common";
import { CmsAdminController } from "./admin/cms-admin.controller";
import { CmsAdminService } from "./admin/cms-admin.service";
import { CmsPublicController } from "./public/cms-public.controller";
import { CmsPublicService } from "./public/cms-public.service";
import { ImageUploadService } from "../services/ImageUploadService";

@Module({
  controllers: [CmsAdminController, CmsPublicController],
  providers: [CmsAdminService, CmsPublicService, ImageUploadService],
})
export class CmsModule {}
