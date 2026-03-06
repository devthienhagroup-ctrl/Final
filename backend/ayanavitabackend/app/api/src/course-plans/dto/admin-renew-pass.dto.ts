import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator'

export class AdminRenewPassDto {
  @IsOptional()
  @IsDateString()
  renewAt?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseId?: number
}
