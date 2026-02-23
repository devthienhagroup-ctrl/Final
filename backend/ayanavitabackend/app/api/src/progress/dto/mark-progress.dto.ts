import { IsInt, IsOptional, Min } from 'class-validator'

export class MarkProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  seconds?: number
}
