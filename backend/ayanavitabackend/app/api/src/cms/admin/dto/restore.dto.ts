import { IsInt } from "class-validator";
import { Type } from "class-transformer";

export class RestoreDto {
  @Type(() => Number)
  @IsInt()
  versionId!: number;
}
