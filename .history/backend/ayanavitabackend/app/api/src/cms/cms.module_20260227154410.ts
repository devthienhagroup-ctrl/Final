import { Module } from "@nestjs/common";
import { CmsAdminController } from "./admin/cms-admin.controller";
import { CmsAdminService } from "./admin/cms-admin.service";
import { CmsPublicController } from "./public/cms-public.controller";
import { CmsPublicService } from "./public/cms-public.service";

@Module({
  controllers: [CmsAdminController, CmsPublicController],
  providers: [CmsAdminService, CmsPublicService],
})
export class CmsModule {}
