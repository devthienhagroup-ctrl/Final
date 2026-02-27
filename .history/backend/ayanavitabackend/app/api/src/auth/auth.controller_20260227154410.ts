import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from '../users/dto/register.dto'
import { LoginDto } from '../users/dto/login.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { RegisterNewDto } from './dto/register-new.dto'

import { AccessTokenGuard } from './guards/access-token.guard'
import { RefreshTokenGuard } from './guards/refresh-token.guard'
import { CurrentUser } from './decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  
  

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto)
  }

  @Post('register-new')
  registerNew(@Body() dto: RegisterNewDto) {
    return this.auth.registerNew(dto)
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@CurrentUser() user: any) {
    return this.auth.refreshTokens(user.sub, user.refreshToken)
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    return this.auth.logout(user.sub)
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user
  }
}
