import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtPayload, verify } from 'jsonwebtoken'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as tls from 'tls'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from '../users/dto/register.dto'
import { LoginDto } from '../users/dto/login.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { RegisterNewDto } from './dto/register-new.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { CheckPasswordDto } from './dto/check-password.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'

type AuthJwtPayload = { sub: number; email: string; role: string }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ForbiddenException('Email đã tồn tại, vui lòng dùng email khác/ hoặc đăng nhập !')

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
        role: 'USER',
      },
      select: { id: true, email: true, name: true, role: true, birthDate: true, gender: true, address: true },
    })

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return { user, ...tokens }
  }

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.trim().toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ForbiddenException('Email đã tồn tại, vui lòng dùng email khác/ hoặc đăng nhập !')

    await this.issueOtp(email, 'xác nhận đăng ký AYANAVITA')
    return { success: true, expiresInSeconds: 300 }
  }

  async registerNew(dto: RegisterNewDto) {
    if (!dto.acceptedPolicy) throw new ForbiddenException('Bạn phải chấp nhận chính sách')

    const email = dto.email.trim().toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ForbiddenException('Email đã tồn tại, vui lòng dùng email khác/ hoặc đăng nhập !')

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
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        address: dto.address,
      },
      select: { id: true, email: true, name: true, role: true, phone: true, birthDate: true, gender: true, address: true },
    })

    await this.prisma.registrationOtp.update({
      where: { email },
      data: { usedAt: new Date() },
    })

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return { user, ...tokens }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        birthDate: true,
        gender: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) throw new UnauthorizedException('User not found')
    return {
      ...user,
      email: this.maskEmail(user.email),
    }
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        address: dto.address,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        updatedAt: true,
      },
    })
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Mật khẩu hiện tại không chính xác')
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    })

    return { success: true, message: 'Đổi mật khẩu thành công' }
  }

  async checkPassword(userId: number, dto: CheckPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Mật khẩu hiện tại không chính xác')
    }

    return { success: true, message: 'Mật khẩu hiện tại chính xác' }
  }

  async sendForgotPasswordOtp(dto: SendOtpDto, accessToken?: string) {
    const email = dto.email.trim().toLowerCase()

    if (accessToken) {
      try {
        const payload = verify(accessToken, process.env.JWT_ACCESS_SECRET ?? '') as JwtPayload
        const authenticatedEmail = payload.email?.trim().toLowerCase()

        if (!authenticatedEmail || authenticatedEmail !== email) {
          throw new ForbiddenException('Email không đúng')
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error
        }

        throw new UnauthorizedException('Phiên đăng nhập không hợp lệ')
      }
    }

    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      return { success: true, message: 'Nếu email tồn tại, hệ thống đã gửi OTP.', expiresInSeconds: 300 }
    }

    await this.issueOtp(email, 'đặt lại mật khẩu AYANAVITA')
    return { success: true, message: 'OTP đã được gửi tới email của bạn.', expiresInSeconds: 300 }
  }

  private maskEmail(email: string) {
    const normalized = email.trim()
    const atIndex = normalized.indexOf('@')

    if (!normalized || atIndex <= 0) return normalized

    const localPart = normalized.slice(0, atIndex)
    const domainPart = normalized.slice(atIndex)
    const visibleLocal = localPart.slice(0, 2)

    return `${visibleLocal}${'*'.repeat(Math.max(localPart.length - 2, 5))}${domainPart}`
  }

  async verifyForgotPasswordOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase()
    const otpRow = await this.prisma.registrationOtp.findUnique({ where: { email } })

    if (!otpRow || otpRow.usedAt || otpRow.code !== dto.otp) {
      throw new ForbiddenException('OTP không hợp lệ')
    }
    if (otpRow.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('OTP đã hết hạn')
    }

    return { success: true, message: 'OTP hợp lệ' }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      return { success: true, message: 'Nếu email tồn tại, hệ thống đã xử lý yêu cầu.' }
    }

    const otpRow = await this.prisma.registrationOtp.findUnique({ where: { email } })
    if (!otpRow || otpRow.usedAt || otpRow.code !== dto.otp) {
      throw new ForbiddenException('OTP không hợp lệ')
    }
    if (otpRow.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('OTP đã hết hạn')
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash },
    })

    await this.prisma.registrationOtp.update({
      where: { email },
      data: { usedAt: new Date() },
    })

    return { success: true, message: 'Đặt lại mật khẩu thành công.' }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(dto.password, user.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    await this.setRefreshTokenHash(user.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        birthDate: user.birthDate,
        gender: user.gender,
        address: user.address,
      },
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

  private async issueOtp(email: string, purpose: string) {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await this.prisma.registrationOtp.upsert({
      where: { email },
      update: { code: otp, expiresAt, usedAt: null },
      create: { email, code: otp, expiresAt },
    })

    void this.sendOtpMail(email, otp, purpose).catch((error) => {
      this.logger.error(`Không gửi được email OTP tới ${email}`, error?.stack ?? String(error))
    })
  }

  private async sendOtpMail(email: string, otp: string, purpose = 'xác nhận đăng ký AYANAVITA') {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'
    const to = email
    const subject = `Mã OTP [${otp}] ${purpose}`
    const body = `Xin chào bạn,\n\nMã OTP xác nhận đăng ký tài khoản AYANAVITA của bạn là: ${otp}.\nMã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn tài khoản.\n\nNếu bạn không thực hiện yêu cầu đăng ký, hãy bỏ qua email này.\n\nTrân trọng,\nĐội ngũ AYANAVITA`
    const html = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP xác nhận đăng ký AYANAVITA</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,0.12);">
            <tr>
              <td style="padding:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;">
                <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.9;">AYANAVITA</div>
                <div style="margin-top:10px;font-size:26px;font-weight:800;line-height:1.2;">Mã OTP của bạn</div>
                <div style="margin-top:14px;display:inline-block;padding:12px 20px;background:#ffffff;color:#4f46e5;border-radius:12px;font-size:34px;font-weight:800;letter-spacing:8px;">${otp}</div>
                <div style="margin-top:10px;font-size:13px;opacity:.95;">Mã có hiệu lực trong <strong>5 phút</strong>.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 6px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Xin chào bạn,</p>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Cảm ơn bạn đã lựa chọn AYANAVITA. Bạn đang thực hiện bước xác minh để hoàn tất đăng ký tài khoản mới. Vui lòng nhập mã OTP ở trên vào màn hình xác thực để tiếp tục.</p>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Để đảm bảo an toàn, vui lòng không chia sẻ mã này cho bất kỳ ai, kể cả người tự xưng là nhân viên hỗ trợ. Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email và không cần làm thêm thao tác nào.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#334155;font-size:13px;line-height:1.7;">
                Trân trọng,<br />
                <strong>Đội ngũ AYANAVITA</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

    await this.sendSmtpViaGmail({ user, pass, to, subject, body, html })
  }

  private async sendSmtpViaGmail(params: { user: string; pass: string; to: string; subject: string; body: string; html?: string }) {
    const { user, pass, to, subject, body, html } = params

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

      const boundary = `aya-boundary-${Date.now()}`
      const message = [
        `Subject: ${subject}`,
        `From: AYANAVITA <${user}>`,
        `To: ${to}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        html ?? body,
        '',
        `--${boundary}--`,
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
    const payload: AuthJwtPayload = { sub: userId, email, role }

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
