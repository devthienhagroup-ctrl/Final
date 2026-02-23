import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class UpsertProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  lastPositionSec?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percent?: number
}
