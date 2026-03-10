import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export enum PurchasePlanMethod {
  SEPAY = 'SEPAY',
  STRIPE_ONE_TIME = 'STRIPE_ONE_TIME',
  STRIPE_SUBSCRIPTION = 'STRIPE_SUBSCRIPTION',
}

export type PurchasePlanMethodValue = `${PurchasePlanMethod}`

export class PurchasePlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseId?: number

  @IsOptional()
  @IsEnum(PurchasePlanMethod)
  method?: PurchasePlanMethodValue

  @IsOptional()
  @IsString()
  @MaxLength(500)
  successUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelUrl?: string
}
