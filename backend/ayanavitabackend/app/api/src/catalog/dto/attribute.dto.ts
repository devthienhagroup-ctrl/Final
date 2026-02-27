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

export class AttributeTranslationDto {
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

export class CreateAttributeKeyDto {
  @IsString()
  @MaxLength(100)
  code!: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  valueType?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeTranslationDto)
  translations!: AttributeTranslationDto[]
}

export class UpdateAttributeKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  valueType?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeTranslationDto)
  translations?: AttributeTranslationDto[]
}
