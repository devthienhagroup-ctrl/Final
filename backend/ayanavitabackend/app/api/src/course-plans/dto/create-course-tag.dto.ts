import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateCourseTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string
}
