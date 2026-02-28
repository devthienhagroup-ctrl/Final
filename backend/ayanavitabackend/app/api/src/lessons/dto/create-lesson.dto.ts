import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class TranslationDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string
}

class LessonVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string
  @IsString()
  @IsNotEmpty()
  description?: string
  @IsString()
  @IsNotEmpty()
  sourceUrl?: string
  @IsEnum(['VIDEO', 'IMAGE'])
  mediaType?: 'VIDEO' | 'IMAGE'
  @IsOptional() @IsInt() @Min(0) durationSec?: number
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
}

class LessonModuleDto {
  @IsString() @IsNotEmpty() title: string
  @IsString() @IsNotEmpty() description?: string
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => LessonVideoDto)
  videos?: LessonVideoDto[]
}

export class CreateLessonDto {
  @IsString() @IsNotEmpty() title!: string
  @IsString() @IsNotEmpty() slug!: string
  @IsString() @IsNotEmpty() description?: string
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsOptional() @IsString() content?: string
  @IsOptional() @IsString() videoUrl?: string
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => LessonModuleDto)
  modules?: LessonModuleDto[]
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
}
