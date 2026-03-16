import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateContactInquiryDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  need?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  note?: string;
}
