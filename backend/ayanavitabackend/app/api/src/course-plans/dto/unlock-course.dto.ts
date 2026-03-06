import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'

export class UnlockCourseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passId?: number
}
