import { Type } from 'class-transformer'
import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator'

export class AddCartItemDto {
  @Type(() => Number)
  @IsInt()
  productId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1
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
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[]
}
