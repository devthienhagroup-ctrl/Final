import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'

export class PurchasePlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseId?: number
}
