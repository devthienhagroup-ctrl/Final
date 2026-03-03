import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { AssignRoleDto } from './dto/assign-role.dto'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'

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
