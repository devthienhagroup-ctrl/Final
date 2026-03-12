import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AdminCoursePlansController } from './admin-course-plans.controller'
import { CoursePlansController } from './course-plans.controller'
import { CoursePlansService } from './course-plans.service'
import { CoursePlanPaymentsService } from './course-plan-payments.service'
import { StripeBillingLinksController } from './stripe-billing-links.controller'
import { StripeBillingLinksService } from './stripe-billing-links.service'

@Module({
  imports: [PrismaModule],
  controllers: [CoursePlansController, AdminCoursePlansController, StripeBillingLinksController],
  providers: [CoursePlansService, CoursePlanPaymentsService, StripeBillingLinksService],
  exports: [CoursePlansService, CoursePlanPaymentsService, StripeBillingLinksService],
})
export class CoursePlansModule {}

