import { Body, Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CoursePlansService } from './course-plans.service'
import { CoursePlanPaymentsService } from './course-plan-payments.service'
import { PurchasePlanDto } from './dto/purchase-plan.dto'
import { UnlockCourseDto } from './dto/unlock-course.dto'

@Controller()
export class CoursePlansController {
  constructor(
    private readonly plans: CoursePlansService,
    private readonly payments: CoursePlanPaymentsService,
  ) {}

  @Get('course-plans')
  listPublicPlans() {
    return this.plans.listPlans({ includeInactive: false })
  }

  @Get('course-plans/:id')
  getPlan(@Param('id', ParseIntPipe) id: number) {
    return this.plans.getPlanById(id, { mustBeActive: true })
  }

  @UseGuards(AccessTokenGuard)
  @Post('course-plans/:id/purchase')
  purchasePlan(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PurchasePlanDto,
  ) {
    if (dto.purchaseId) {
      return this.plans.purchasePlan(user.sub, id, dto)
    }
    return this.payments.createCheckout(user.sub, id)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/course-passes')
  myCoursePasses(@CurrentUser() user: JwtUser) {
    return this.plans.listMyPasses(user.sub)
  }
  @UseGuards(AccessTokenGuard)
  @Get('me/course-plan-payments')
  myCoursePlanPayments(@CurrentUser() user: JwtUser) {
    return this.payments.listMyPayments(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/course-entitlements')
  myCourseEntitlements(
    @CurrentUser() user: JwtUser,
    @Query('includeExpired', new ParseBoolPipe({ optional: true })) includeExpired?: boolean,
  ) {
    return this.plans.listMyEntitlements(user.sub, { includeExpired: includeExpired ?? false })
  }

  @UseGuards(AccessTokenGuard)
  @Post('me/courses/:id/unlock')
  unlockCourse(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) courseId: number,
    @Body() dto: UnlockCourseDto,
  ) {
    return this.plans.unlockCourse(user.sub, courseId, dto)
  }
}



