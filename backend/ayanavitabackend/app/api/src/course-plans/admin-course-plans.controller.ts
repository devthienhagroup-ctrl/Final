import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { CoursePlansService } from './course-plans.service'
import { AdminCreatePassDto } from './dto/admin-create-pass.dto'
import { AdminGrantEntitlementDto } from './dto/admin-grant-entitlement.dto'
import { AdminRenewPassDto } from './dto/admin-renew-pass.dto'
import { CreateCoursePlanDto } from './dto/create-course-plan.dto'
import { CreateCourseTagDto } from './dto/create-course-tag.dto'
import { ListAdminPassesDto } from './dto/list-admin-passes.dto'
import { SetCourseTagsDto } from './dto/set-course-tags.dto'
import { UpdateCoursePlanDto } from './dto/update-course-plan.dto'
import { UpdateCourseTagDto } from './dto/update-course-tag.dto'

@UseGuards(AccessTokenGuard, PermissionGuard)
@Controller('admin')
export class AdminCoursePlansController {
  constructor(private readonly plans: CoursePlansService) {}

  @Permissions('packages.read')
  @Get('course-tags')
  listTags() {
    return this.plans.listTags()
  }

  @Permissions('packages.write')
  @Post('course-tags')
  createTag(@Body() dto: CreateCourseTagDto) {
    return this.plans.createTag(dto)
  }

  @Permissions('packages.write')
  @Patch('course-tags/:id')
  updateTag(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseTagDto) {
    return this.plans.updateTag(id, dto)
  }

  @Permissions('packages.manage')
  @Delete('course-tags/:id')
  deleteTag(@Param('id', ParseIntPipe) id: number) {
    return this.plans.deleteTag(id)
  }

  @Permissions('packages.write')
  @Put('courses/:id/tags')
  setCourseTags(@Param('id', ParseIntPipe) id: number, @Body() dto: SetCourseTagsDto) {
    return this.plans.setCourseTags(id, dto)
  }

  @Permissions('packages.read')
  @Get('course-plans')
  listPlans(@Query('includeInactive') includeInactive?: string) {
    return this.plans.listPlans({ includeInactive: includeInactive === '1' || includeInactive === 'true' })
  }

  @Permissions('packages.read')
  @Get('course-plans/overview')
  getOverview() {
    return this.plans.getAdminOverview()
  }

  @Permissions('packages.read')
  @Get('course-plans/:id')
  getPlan(@Param('id', ParseIntPipe) id: number) {
    return this.plans.getPlanById(id)
  }

  @Permissions('packages.write')
  @Post('course-plans')
  createPlan(@Body() dto: CreateCoursePlanDto) {
    return this.plans.createPlan(dto)
  }

  @Permissions('packages.write')
  @Patch('course-plans/:id')
  updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCoursePlanDto) {
    return this.plans.updatePlan(id, dto)
  }

  @Permissions('packages.manage')
  @Delete('course-plans/:id')
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.plans.deletePlan(id)
  }

  @Permissions('packages.read')
  @Get('course-passes')
  listPasses(@Query() query: ListAdminPassesDto) {
    return this.plans.listAdminPasses(query)
  }

  @Permissions('packages.write')
  @Post('course-passes')
  createPass(@Body() dto: AdminCreatePassDto) {
    return this.plans.createPass(dto)
  }

  @Permissions('packages.write')
  @Post('course-passes/:id/renew')
  renewPass(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminRenewPassDto) {
    return this.plans.renewPass(id, dto)
  }

  @Permissions('packages.manage')
  @Post('course-passes/:id/cancel')
  cancelPass(@Param('id', ParseIntPipe) id: number) {
    return this.plans.cancelPass(id)
  }

  @Permissions('packages.manage')
  @Post('course-entitlements/grant')
  grantEntitlement(@CurrentUser() user: JwtUser, @Body() dto: AdminGrantEntitlementDto) {
    return this.plans.grantAdminEntitlement(user.sub, dto)
  }
}
