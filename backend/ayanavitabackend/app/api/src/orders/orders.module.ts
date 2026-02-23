import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { EnrollmentsModule } from '../enrollments/enrollments.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
  imports: [PrismaModule, EnrollmentsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
