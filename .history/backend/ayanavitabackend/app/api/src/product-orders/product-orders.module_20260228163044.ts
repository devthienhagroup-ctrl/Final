
import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ProductOrdersController } from './product-orders.controller'
import { ProductOrdersService } from './product-orders.service'

@Module({
  imports: [PrismaModule],
  controllers: [ProductOrdersController],
  providers: [ProductOrdersService],
})
export class ProductOrdersModule {}
