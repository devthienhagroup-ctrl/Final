import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateLessonDto {
  @IsString()
  title!: string

  @IsString()
  slug!: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean
}
