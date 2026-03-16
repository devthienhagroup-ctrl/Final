import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class ReplyContactInquiryDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  toEmail?: string;

  @IsString()
  @MaxLength(255)
  subject!: string;

  @IsString()
  @MaxLength(5000)
  content!: string;
}
