import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { CoursePlansModule } from '../course-plans/course-plans.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { SepayWebhookController } from './sepay-webhook.controller'

@Module({
  imports: [PrismaModule, CoursePlansModule],
  controllers: [OrdersController, SepayWebhookController],
  providers: [OrdersService],
})
export class OrdersModule {}

