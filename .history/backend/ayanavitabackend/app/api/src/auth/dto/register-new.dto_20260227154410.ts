import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterNewDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsString()
  phone!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string

  @IsBoolean()
  acceptedPolicy!: boolean
}
