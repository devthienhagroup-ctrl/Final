import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { DashboardService } from './dashboard.service'

@UseGuards(AccessTokenGuard, PermissionGuard)
@Permissions('dashboard.admin')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Query('range') range?: string) {
    return this.dashboardService.getStats(range)
  }
}
