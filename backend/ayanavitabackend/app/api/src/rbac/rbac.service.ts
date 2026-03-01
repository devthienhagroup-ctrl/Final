import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AssignPermissionsDto } from './dto/assign-permissions.dto'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { UpdateRoleDto } from './dto/update-role.dto'

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  createRole(dto: CreateRoleDto) {
    return this.prisma.rbacRole.create({ data: dto })
  }

  findAllRoles() {
    return this.prisma.rbacRole.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { id: 'asc' },
    })
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    await this.ensureRole(id)
    return this.prisma.rbacRole.update({ where: { id }, data: dto })
  }

  async deleteRole(id: number) {
    await this.ensureRole(id)
    return this.prisma.rbacRole.delete({ where: { id } })
  }

  createPermission(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto })
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: { id: 'asc' } })
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    await this.ensurePermission(id)
    return this.prisma.permission.update({ where: { id }, data: dto })
  }

  async deletePermission(id: number) {
    await this.ensurePermission(id)
    return this.prisma.permission.delete({ where: { id } })
  }

  async assignPermissionsToRole(roleId: number, dto: AssignPermissionsDto) {
    await this.ensureRole(roleId)

    const found = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
      select: { id: true },
    })

    if (found.length !== dto.permissionIds.length) {
      throw new NotFoundException('Một hoặc nhiều permission không tồn tại')
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: [...new Set(dto.permissionIds)].map((permissionId) => ({ roleId, permissionId })),
      }),
    ])

    return this.prisma.rbacRole.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    })
  }

  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRef: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    })

    if (!user) throw new NotFoundException('User not found')

    return {
      id: user.id,
      role: user.roleRef?.code ?? null,
      scopeType: user.roleRef?.scopeType ?? null,
      permissions: user.roleRef?.permissions.map((rp) => rp.permission.code) ?? [],
    }
  }

  private async ensureRole(id: number) {
    const role = await this.prisma.rbacRole.findUnique({ where: { id }, select: { id: true } })
    if (!role) throw new NotFoundException('Role not found')
  }

  private async ensurePermission(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id }, select: { id: true } })
    if (!permission) throw new NotFoundException('Permission not found')
  }
}
