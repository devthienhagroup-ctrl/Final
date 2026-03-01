import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { AssignPermissionsDto } from './dto/assign-permissions.dto'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RbacService } from './rbac.service'

@UseGuards(AccessTokenGuard, PermissionGuard)
@Controller()
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Post('roles')
  @Permissions('role.manage')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbac.createRole(dto)
  }

  @Get('roles')
  @Permissions('role.read')
  getRoles() {
    return this.rbac.findAllRoles()
  }

  @Put('roles/:id')
  @Permissions('role.manage')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rbac.updateRole(id, dto)
  }

  @Delete('roles/:id')
  @Permissions('role.manage')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbac.deleteRole(id)
  }

  @Post('permissions')
  @Permissions('role.manage')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbac.createPermission(dto)
  }

  @Get('permissions')
  @Permissions('role.read')
  getPermissions() {
    return this.rbac.findAllPermissions()
  }

  @Put('permissions/:id')
  @Permissions('role.manage')
  updatePermission(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) {
    return this.rbac.updatePermission(id, dto)
  }

  @Delete('permissions/:id')
  @Permissions('role.manage')
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.rbac.deletePermission(id)
  }

  @Post('roles/:roleId/permissions')
  @Permissions('role.manage')
  assignPermissions(@Param('roleId', ParseIntPipe) roleId: number, @Body() dto: AssignPermissionsDto) {
    return this.rbac.assignPermissionsToRole(roleId, dto)
  }
}
