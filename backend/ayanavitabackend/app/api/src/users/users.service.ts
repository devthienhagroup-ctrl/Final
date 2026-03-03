import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as tls from 'tls'
import { PrismaService } from '../prisma/prisma.service'
import { AdminCreateUserDto } from './dto/admin-create-user.dto'
import { AdminUpdateUserDto } from './dto/admin-update-user.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly prisma: PrismaService) {}
  

  async findAll() {
    const rows = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        isActive: true,
        role: true,
        roleId: true,
        hashedRefreshToken: true,
        roleRef: { select: { code: true, scopeType: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    })

    return rows.map((row) => ({
      ...row,
      hasRefreshToken: Boolean(row.hashedRefreshToken),
      hashedRefreshToken: undefined,
    }))
  }

  async getChangeLogs(limit = 200) {
    return this.prisma.userManagementLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: { select: { email: true } },
        targetUser: { select: { email: true, name: true } },
      },
    })
  }

  async createUser(dto: AdminCreateUserDto, actorUserId?: number) {
    const email = dto.email.trim().toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (exists) throw new BadRequestException('Email đã tồn tại')

    const plainPassword = this.generatePassword()
    const password = await bcrypt.hash(plainPassword, 10)

    const userRole = await this.prisma.rbacRole.findUnique({ where: { code: 'USER' }, select: { id: true } })

    const created = await this.prisma.user.create({
      data: {
        email,
        name: this.normalizeOptionalString(dto.name),
        phone: this.normalizeOptionalString(dto.phone),
        address: this.normalizeOptionalString(dto.address),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        isActive: dto.isActive ?? true,
        password,
        role: 'USER',
        roleId: userRole?.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        isActive: true,
        role: true,
        roleId: true,
        roleRef: { select: { code: true, scopeType: true } },
        createdAt: true,
        updatedAt: true,
      },
    })

    await this.logAction({
      action: 'USER_CREATED',
      actorUserId,
      targetUserId: created.id,
      message: `Tạo user ${created.email}`,
      metadata: {
        name: created.name ?? null,
        phone: created.phone ?? null,
        isActive: created.isActive,
        birthDate: created.birthDate,
        gender: created.gender,
        address: created.address,
      },
      newEmail: created.email,
    })

    void this.sendUserCreatedMail(created.email, plainPassword, created.name ?? '').catch((error) => {
      this.logger.error(`Không gửi được email thông tin tài khoản tới ${created.email}`, error?.stack ?? String(error))
    })

    return created
  }

  async updateUser(userId: number, dto: AdminUpdateUserDto, actorUserId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        role: true,
        roleId: true,
      },
    })
    if (!user) throw new NotFoundException('User not found')

    const data: {
      email?: string
      name?: string | null
      isActive?: boolean
      phone?: string | null
      birthDate?: Date | null
      gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
      address?: string | null
    } = {}
    const changes: string[] = []

    if (dto.name !== undefined) {
      const normalizedName = this.normalizeOptionalString(dto.name)
      if (normalizedName !== user.name) {
        data.name = normalizedName
        changes.push('name')
      }
    }

    if (dto.phone !== undefined) {
      const normalizedPhone = this.normalizeOptionalString(dto.phone)
      if (normalizedPhone !== user.phone) {
        data.phone = normalizedPhone
        changes.push('phone')
      }
    }

    if (dto.address !== undefined) {
      const normalizedAddress = this.normalizeOptionalString(dto.address)
      if (normalizedAddress !== user.address) {
        data.address = normalizedAddress
        changes.push('address')
      }
    }

    if (dto.birthDate !== undefined) {
      const normalizedBirthDate = dto.birthDate ? new Date(dto.birthDate) : null
      const prevBirthDate = user.birthDate ? user.birthDate.getTime() : null
      const nextBirthDate = normalizedBirthDate ? normalizedBirthDate.getTime() : null
      if (prevBirthDate !== nextBirthDate) {
        data.birthDate = normalizedBirthDate
        changes.push('birthDate')
      }
    }

    if (dto.gender !== undefined && dto.gender !== user.gender) {
      data.gender = dto.gender
      changes.push('gender')
    }

    if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
      data.isActive = dto.isActive
      changes.push('isActive')
    }

    if (dto.email !== undefined) {
      const newEmail = dto.email.trim().toLowerCase()
      if (newEmail !== user.email) {
        const exists = await this.prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })
        if (exists) throw new BadRequestException('Email đã tồn tại')
        data.email = newEmail
        changes.push('email')
      }
    }

    if (Object.keys(data).length === 0) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        message: 'Không có thay đổi nào',
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        isActive: true,
        role: true,
        roleId: true,
        roleRef: { select: { code: true, scopeType: true } },
        updatedAt: true,
      },
    })

    await this.logAction({
      action: 'USER_UPDATED',
      actorUserId,
      targetUserId: userId,
      message: `Cập nhật user ${updated.email}: ${changes.join(', ')}`,
      metadata: {
        changedFields: changes,
        before: user,
        after: {
          email: updated.email,
          name: updated.name,
          phone: updated.phone,
          birthDate: updated.birthDate,
          gender: updated.gender,
          address: updated.address,
          isActive: updated.isActive,
        },
      },
      oldEmail: user.email,
      newEmail: updated.email,
    })

    if (data.email) {
      void this.sendEmailChangedNotification(user.email, updated.email, updated.name ?? '').catch((error) => {
        this.logger.error(`Không gửi được email thông báo đổi email tới ${user.email}`, error?.stack ?? String(error))
      })
    }

    return updated
  }

  async deleteUser(userId: number, actorUserId?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
    if (!user) throw new NotFoundException('User not found')

    await this.prisma.user.delete({ where: { id: userId } })

    await this.logAction({
      action: 'USER_DELETED',
      actorUserId,
      targetUserId: userId,
      message: `Xóa user ${user.email}`,
      oldEmail: user.email,
    })

    return { success: true }
  }

  async resetPassword(userId: number, actorUserId?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } })
    if (!user) throw new NotFoundException('User not found')

    const plainPassword = this.generatePassword()
    const password = await bcrypt.hash(plainPassword, 10)

    await this.prisma.user.update({
      where: { id: userId },
      data: { password },
    })

    await this.logAction({
      action: 'USER_PASSWORD_RESET',
      actorUserId,
      targetUserId: userId,
      message: `Reset mật khẩu cho ${user.email}`,
    })

    void this.sendResetPasswordMail(user.email, plainPassword, user.name ?? '').catch((error) => {
      this.logger.error(`Không gửi được email reset password tới ${user.email}`, error?.stack ?? String(error))
    })

    return { success: true, message: 'Đã reset mật khẩu và gửi email cho user' }
  }

  async assignRole(userId: number, roleId: number, actorUserId?: number) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.rbacRole.findUnique({ where: { id: roleId }, select: { id: true, code: true, scopeType: true } }),
    ])

    if (!user) throw new NotFoundException('User not found')
    if (!role) throw new NotFoundException('Role not found')

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        email: true,
        roleId: true,
        roleRef: { select: { id: true, code: true, scopeType: true } },
      },
    })

    await this.prisma.roleAuditLog.create({
      data: {
        action: 'USER_ROLE_ASSIGNED',
        message: `Gán role ${role.code} cho ${updated.email}`,
        actorUserId: actorUserId ?? null,
        targetUserId: userId,
        roleId,
        metadata: { roleCode: role.code, scopeType: role.scopeType },
      },
    })

    return updated
  }

  private async logAction(params: {
    action: string
    message: string
    actorUserId?: number
    targetUserId: number
    metadata?: Prisma.InputJsonValue
    oldEmail?: string
    newEmail?: string
  }) {
    await this.prisma.userManagementLog.create({
      data: {
        action: params.action,
        message: params.message,
        actorUserId: params.actorUserId ?? null,
        targetUserId: params.targetUserId,
        oldEmail: params.oldEmail ?? null,
        newEmail: params.newEmail ?? null,
        // JSON null "đúng kiểu" cho Prisma:
        metadata: params.metadata ?? Prisma.JsonNull,
      },
    })
  }

  private normalizeOptionalString(value?: string) {
    if (value === undefined) return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private generatePassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  private async sendUserCreatedMail(email: string, password: string, name: string) {
    const subject = 'Tài khoản AYANAVITA của bạn đã được tạo'
    const body = `Xin chào ${name || 'bạn'},\n\nTài khoản của bạn đã được tạo trên hệ thống AYANAVITA.\nEmail đăng nhập: ${email}\nMật khẩu tạm thời: ${password}\n\nVui lòng đăng nhập và đổi mật khẩu để đảm bảo an toàn.\n\nTrân trọng,\nĐội ngũ AYANAVITA`
    await this.sendSmtpViaGmail(email, subject, body)
  }

  private async sendResetPasswordMail(email: string, password: string, name: string) {
    const subject = 'Mật khẩu mới tài khoản AYANAVITA'
    const customerName = name || 'bạn'
    const year = new Date().getFullYear()
    const body = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Ayanavita - Mật khẩu</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;padding:32px 28px;
                 box-shadow:0 8px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="font-size:20px;font-weight:700;color:#111827;">
              Ayanavita
            </td>
          </tr>
          <tr>
            <td style="padding-top:18px;font-size:18px;font-weight:600;color:#111827;">
              Mật khẩu đăng nhập của bạn
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:14px;color:#4b5563;line-height:1.6;">
              Xin chào ${customerName},<br>
              Đây là mật khẩu tạm thời của bạn:
            </td>
          </tr>
          <tr>
            <td style="padding:18px 0;">
              <div style="background:#111827;color:#ffffff;
                          padding:14px 16px;border-radius:10px;
                          font-size:18px;font-weight:700;
                          letter-spacing:1px;text-align:center;">
                ${password}
              </div>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;line-height:1.6;">
              Vui lòng đăng nhập và đổi mật khẩu để bảo mật tài khoản.
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;">
              © ${year} Ayanavita
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    await this.sendSmtpViaGmail(email, subject, body, true)
  }

  private async sendEmailChangedNotification(oldEmail: string, newEmail: string, name: string) {
    const subject = 'Thông báo thay đổi email tài khoản AYANAVITA'
    const customerName = name || 'bạn'
    const year = new Date().getFullYear()
    const body = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Ayanavita - Thay đổi Email</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;padding:32px 28px;
                 box-shadow:0 8px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="font-size:20px;font-weight:700;color:#111827;">
              Ayanavita
            </td>
          </tr>
          <tr>
            <td style="padding-top:18px;font-size:18px;font-weight:600;color:#111827;">
              Email tài khoản đã được cập nhật
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-size:14px;color:#4b5563;line-height:1.6;">
              Xin chào ${customerName},<br>
              Email đăng nhập của bạn đã được thay đổi thành:
            </td>
          </tr>
          <tr>
            <td style="padding:18px 0;">
              <div style="background:#eef2ff;color:#111827;
                          padding:14px 16px;border-radius:10px;
                          font-size:15px;font-weight:600;text-align:center;">
                ${newEmail}
              </div>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;line-height:1.6;">
              Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ hỗ trợ ngay.
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;">
              © ${year} Ayanavita
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    await this.sendSmtpViaGmail(oldEmail, subject, body, true)
  }

  private async sendSmtpViaGmail(to: string, subject: string, body: string, isHtml = false) {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'

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
      if (!greeting.startsWith('220')) throw new Error(`SMTP greeting failed: ${greeting}`)

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
        'MIME-Version: 1.0',
        `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8`,
        '',
        body,
      ].join('\r\n')

      socket.write(`${message}\r\n.\r\n`)
      const dataResponse = await readSmtpResponse(socket)
      if (!dataResponse.startsWith('250')) throw new Error(`SMTP DATA failed: ${dataResponse}`)
      await sendCommand(socket, 'QUIT', [221])
    } finally {
      socket.end()
      socket.destroy()
    }
  }
}
