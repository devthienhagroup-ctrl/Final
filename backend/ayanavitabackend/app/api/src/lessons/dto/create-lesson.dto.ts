import { Type } from 'class-transformer'
import { IsArray, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class TranslationDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string
}

class LessonVideoDto {
  @IsString()
  title: string
  @IsOptional() @IsString() description?: string
  @IsString() sourceUrl: string
  @IsOptional() @IsString() mediaType?: 'VIDEO' | 'IMAGE'
  @IsOptional() @IsInt() @Min(0) durationSec?: number
  @IsInt() @Min(0) stt: number
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
}

class LessonModuleDto {
  @IsString() title: string
  @IsOptional() @IsString() description?: string
  @IsInt() @Min(0) stt: number
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsArray() @ValidateNested({ each: true }) @Type(() => LessonVideoDto)
  videos: LessonVideoDto[]
}

export class CreateLessonDto {
  @IsString() title!: string
  @IsString() slug!: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsOptional() @IsString() content?: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => LessonModuleDto)
  modules: LessonModuleDto[]
  @IsInt() @Min(0) stt: number
}
