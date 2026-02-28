import { IsEmail, IsString } from 'class-validator'

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string

  @IsString()
  otp!: string
}