import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AdminCoursePlansController } from './admin-course-plans.controller'
import { CoursePlansController } from './course-plans.controller'
import { CoursePlansService } from './course-plans.service'
import { CoursePlanPaymentsService } from './course-plan-payments.service'

@Module({
  imports: [PrismaModule],
  controllers: [CoursePlansController, AdminCoursePlansController],
  providers: [CoursePlansService, CoursePlanPaymentsService],
  exports: [CoursePlansService, CoursePlanPaymentsService],
})
export class CoursePlansModule {}


