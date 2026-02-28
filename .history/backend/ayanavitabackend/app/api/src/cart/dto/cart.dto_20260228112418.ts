import { Type } from 'class-transformer'
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

export class AddCartItemDto {
  @Type(() => Number)
  @IsInt()
  productId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1

  @IsOptional()
  @IsString()
  variantId?: string
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  quantity!: number
}

export class MergeCartItemDto {
  @Type(() => Number)
  @IsInt()
  productId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number

  @IsOptional()
  @IsString()
  variantId?: string
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[]
}
