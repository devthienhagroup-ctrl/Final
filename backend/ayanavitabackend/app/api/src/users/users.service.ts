import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        roleRef: { select: { code: true, scopeType: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    })
  }

  async assignRole(userId: number, roleId: number) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.rbacRole.findUnique({ where: { id: roleId }, select: { id: true, code: true, scopeType: true } }),
    ])

    if (!user) throw new NotFoundException('User not found')
    if (!role) throw new NotFoundException('Role not found')

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        email: true,
        roleId: true,
        roleRef: { select: { id: true, code: true, scopeType: true } },
      },
    })
  }
}
