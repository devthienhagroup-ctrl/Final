import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OrdersController, SepayWebhookController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController, SepayWebhookController],
  providers: [OrdersService],
})
export class OrdersModule {}
