import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator'

export class ProductAttributeValueDto {
  @Type(() => Number)
  @IsInt()
  attributeKeyId!: number

  @IsOptional()
  @IsString()
  valueText?: string

  @IsOptional()
  @Type(() => Number)
  valueNumber?: number

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  valueBoolean?: boolean

  @IsOptional()
  @IsString()
  valueJson?: string
}

export class ProductIngredientValueDto {
  @Type(() => Number)
  @IsInt()
  ingredientKeyId!: number

  @IsOptional()
  @IsString()
  value?: string

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number
}

export class UpsertProductAttributesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  items!: ProductAttributeValueDto[]
}

export class UpsertProductIngredientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientValueDto)
  items!: ProductIngredientValueDto[]
}
