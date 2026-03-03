import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { AssignRoleDto } from './dto/assign-role.dto'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AdminCreateUserDto } from './dto/admin-create-user.dto'
import { AdminUpdateUserDto } from './dto/admin-update-user.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.read')
  @Get()
  findAll() {
    return this.users.findAll()
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.read')
  @Get('change-logs')
  getChangeLogs() {
    return this.users.getChangeLogs()
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.manage')
  @Post()
  createUser(@Body() dto: AdminCreateUserDto, @CurrentUser() actor: JwtUser) {
    return this.users.createUser(dto, actor?.sub)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.manage')
  @Put(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.users.updateUser(id, dto, actor?.sub)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.manage')
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtUser) {
    return this.users.deleteUser(id, actor?.sub)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.manage')
  @Post(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtUser) {
    return this.users.resetPassword(id, actor?.sub)
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions('role.manage')
  @Put(':id/role')
  assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.users.assignRole(id, dto.roleId, actor?.sub)
  }
}
