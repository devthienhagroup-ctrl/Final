import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as tls from 'tls'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from '../users/dto/register.dto'
import { LoginDto } from '../users/dto/login.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { RegisterNewDto } from './dto/register-new.dto'

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

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.trim().toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ForbiddenException('Email already exists')

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await this.prisma.registrationOtp.upsert({
      where: { email },
      update: { code: otp, expiresAt, usedAt: null },
      create: { email, code: otp, expiresAt },
    })

    await this.sendOtpMail(email, otp)

    return { success: true, expiresInSeconds: 300 }
  }

  async registerNew(dto: RegisterNewDto) {
    if (!dto.acceptedPolicy) throw new ForbiddenException('Bạn phải chấp nhận chính sách')

    const email = dto.email.trim().toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ForbiddenException('Email already exists')

    const otpRow = await this.prisma.registrationOtp.findUnique({ where: { email } })
    if (!otpRow || otpRow.usedAt || otpRow.code !== dto.otp) {
      throw new ForbiddenException('OTP không hợp lệ')
    }
    if (otpRow.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('OTP đã hết hạn')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: 'USER',
      },
      select: { id: true, email: true, name: true, role: true, phone: true },
    })

    await this.prisma.registrationOtp.update({
      where: { email },
      data: { usedAt: new Date() },
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
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

  private async sendOtpMail(email: string, otp: string) {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'
    const to = email
    const subject = 'Mã OTP xác nhận đăng ký AYANAVITA'
    const body = `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`

    await this.sendSmtpViaGmail({ user, pass, to, subject, body })
  }

  private async sendSmtpViaGmail(params: { user: string; pass: string; to: string; subject: string; body: string }) {
    const { user, pass, to, subject, body } = params

    const readSmtpResponse = (socket: tls.TLSSocket) =>
      new Promise<string>((resolve, reject) => {
        let buffer = ''

        const cleanup = () => {
          socket.off('data', onData)
          socket.off('error', onError)
          socket.off('close', onClose)
        }

        const onError = (err: Error) => {
          cleanup()
          reject(err)
        }

        const onClose = () => {
          cleanup()
          reject(new Error('SMTP connection closed unexpectedly'))
        }

        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          const normalized = buffer.replace(/\r\n/g, '\n')
          const lines = normalized.split('\n').filter(Boolean)
          if (lines.length === 0) return

          const lastLine = lines[lines.length - 1]
          if (!/^\d{3} /.test(lastLine)) return

          cleanup()
          resolve(normalized.trim())
        }

        socket.on('data', onData)
        socket.once('error', onError)
        socket.once('close', onClose)
      })

    const sendCommand = async (socket: tls.TLSSocket, command: string, expectedCodes: number[]) => {
      socket.write(`${command}\r\n`)
      const response = await readSmtpResponse(socket)
      const code = Number(response.slice(0, 3))
      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP command failed (${command}): ${response}`)
      }
      return response
    }

    const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const client = tls.connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com' }, () => resolve(client))
      client.once('error', reject)
    })

    try {
      const greeting = await readSmtpResponse(socket)
      if (!greeting.startsWith('220')) {
        throw new Error(`SMTP greeting failed: ${greeting}`)
      }

      await sendCommand(socket, 'EHLO ayanavita.local', [250])
      await sendCommand(socket, 'AUTH LOGIN', [334])
      await sendCommand(socket, Buffer.from(user).toString('base64'), [334])
      await sendCommand(socket, Buffer.from(pass).toString('base64'), [235])
      await sendCommand(socket, `MAIL FROM:<${user}>`, [250])
      await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251])
      await sendCommand(socket, 'DATA', [354])

      const message = [
        `Subject: ${subject}`,
        `From: AYANAVITA <${user}>`,
        `To: ${to}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body,
        '.',
      ].join('\r\n')
      socket.write(`${message}\r\n`)
      const dataResponse = await readSmtpResponse(socket)
      if (!dataResponse.startsWith('250')) {
        throw new Error(`SMTP send failed: ${dataResponse}`)
      }

      await sendCommand(socket, 'QUIT', [221])
    } finally {
      socket.end()
    }
  }

  private issueTokens(userId: number, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role }

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: 15 * 60,
    })

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: 7 * 24 * 60 * 60,
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
