import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class IngredientTranslationDto {
  @IsString()
  @MaxLength(10)
  languageCode!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName!: string

  @IsOptional()
  @IsString()
  description?: string
}

export class CreateIngredientKeyDto {
  @IsString()
  @MaxLength(100)
  code!: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientTranslationDto)
  translations!: IngredientTranslationDto[]
}

export class UpdateIngredientKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientTranslationDto)
  translations?: IngredientTranslationDto[]
}
