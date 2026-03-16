import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class AdminListContactInquiriesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["new", "replied"])
  status?: "new" | "replied";

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize: number = 20;
}
