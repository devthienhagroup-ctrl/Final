import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AssignPermissionsDto } from './dto/assign-permissions.dto'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { CheckPermissionDto } from './dto/check-permission.dto'

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto, actorUserId?: number) {
    const role = await this.prisma.rbacRole.create({ data: dto })
    await this.logRoleAction('ROLE_CREATED', `Tạo role ${role.code}`, { actorUserId, roleId: role.id })
    return role
  }

  findAllRoles() {
    return this.prisma.rbacRole.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { id: 'asc' },
    })
  }

  async updateRole(id: number, dto: UpdateRoleDto, actorUserId?: number) {
    await this.ensureRole(id)
    const role = await this.prisma.rbacRole.update({ where: { id }, data: dto })
    await this.logRoleAction('ROLE_UPDATED', `Sửa role ${role.code}`, { actorUserId, roleId: role.id })
    return role
  }

  async deleteRole(id: number, actorUserId?: number) {
    const role = await this.prisma.rbacRole.findUnique({ where: { id }, select: { id: true, code: true } })
    if (!role) throw new NotFoundException('Role not found')
    await this.prisma.rbacRole.delete({ where: { id } })
    await this.logRoleAction('ROLE_DELETED', `Xoá role ${role.code}`, { actorUserId, roleId: role.id })
    return { ok: true }
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

  async assignPermissionsToRole(roleId: number, dto: AssignPermissionsDto, actorUserId?: number) {
    const role = await this.prisma.rbacRole.findUnique({ where: { id: roleId }, select: { id: true, code: true } })
    if (!role) throw new NotFoundException('Role not found')

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

    const updated = await this.prisma.rbacRole.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    })
    await this.logRoleAction('ROLE_PERMISSION_ASSIGNED', `Cập nhật permission cho role ${role.code}`, {
      actorUserId,
      roleId: role.id,
      metadata: { permissionIds: dto.permissionIds },
    })
    return updated
  }

  async checkPermission(dto: CheckPermissionDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        roleRef: {
          select: {
            code: true,
            permissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    })
    const permKey = `${dto.module}.${dto.action}`
    const currentRole = user?.roleRef?.code ?? null
    const active = currentRole === dto.roleCode
    const permSet = new Set(user?.roleRef?.permissions.map((rp) => rp.permission.code) ?? [])
    const allowed = active && permSet.has(permKey)
    return { permKey, active, allowed, reason: allowed ? 'OK' : active ? 'MISSING_PERMISSION' : 'ROLE_NOT_ASSIGNED', source: 'server' as const }
  }

  async getRoleAuditLogs(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200)
    const rows = await this.prisma.roleAuditLog.findMany({
      take,
      orderBy: { id: 'desc' },
      include: {
        actorUser: { select: { email: true } },
        targetUser: { select: { email: true } },
        role: { select: { code: true } },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      message: row.message,
      actorUserId: row.actorUserId,
      actorEmail: row.actorUser?.email ?? null,
      targetUserId: row.targetUserId,
      targetEmail: row.targetUser?.email ?? null,
      roleId: row.roleId,
      roleCode: row.role?.code ?? null,
      createdAt: row.createdAt,
    }))
  }

  async logRoleAction(action: string, message: string, params: { actorUserId?: number | null; targetUserId?: number | null; roleId?: number | null; metadata?: unknown }) {
    await this.prisma.roleAuditLog.create({
      data: {
        action,
        message,
        actorUserId: params.actorUserId ?? null,
        targetUserId: params.targetUserId ?? null,
        roleId: params.roleId ?? null,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
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
