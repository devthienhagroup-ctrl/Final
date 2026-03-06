import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateCourseTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string
}
