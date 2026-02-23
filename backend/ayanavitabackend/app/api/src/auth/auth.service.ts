import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from '../users/dto/register.dto'
import { LoginDto } from '../users/dto/login.dto'

type JwtPayload = { sub: number; email: string; role: string }

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ForbiddenException('Email already exists')

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
        role: 'USER',
      },
      select: { id: true, email: true, name: true, role: true },
    })

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return { user, ...tokens }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(dto.password, user.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    }
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access denied')

    const ok = await bcrypt.compare(refreshToken, user.hashedRefreshToken)
    if (!ok) throw new ForbiddenException('Access denied')

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return tokens
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    })
    return { success: true }
  }

  private issueTokens(userId: number, email: string, role: string) {
  const payload: JwtPayload = { sub: userId, email, role }

  const accessToken = this.jwt.sign(payload, {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: 15 * 60, // 15 phút
  })

  const refreshToken = this.jwt.sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: 7 * 24 * 60 * 60, // 7 ngày
  })

  return { accessToken, refreshToken }
}


  private async setRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    })
  }
}
