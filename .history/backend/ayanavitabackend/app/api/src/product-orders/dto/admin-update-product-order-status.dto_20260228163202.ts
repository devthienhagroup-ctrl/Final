
import { IsEnum } from 'class-validator'
import { ProductOrderStatus } from '@prisma/client'

export class AdminUpdateProductOrderStatusDto {
  @IsEnum(ProductOrderStatus)
  status!: ProductOrderStatus
}
