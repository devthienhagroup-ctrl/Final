import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl!: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}
