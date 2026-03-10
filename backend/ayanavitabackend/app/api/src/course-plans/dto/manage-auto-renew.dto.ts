import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'

export class ManageAutoRenewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  planId?: number
}
