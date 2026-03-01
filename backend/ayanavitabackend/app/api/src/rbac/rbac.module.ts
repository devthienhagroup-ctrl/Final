import { Module } from '@nestjs/common'
import { RbacController } from './rbac.controller'
import { RbacService } from './rbac.service'
import { PermissionGuard } from '../auth/guards/permission.guard'

@Module({
  controllers: [RbacController],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService],
})
export class RbacModule {}
