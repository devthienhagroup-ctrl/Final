import { Module } from '@nestjs/common'
import { CoursePlansModule } from '../course-plans/course-plans.module'
import { PaymentsController } from './stripe.controller'
import { PaymentsService } from './stripe.service'
import { StripeWebhookController } from './stripe.webhooks'

@Module({
  imports: [CoursePlansModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService],
})
export class StripeModule {}
