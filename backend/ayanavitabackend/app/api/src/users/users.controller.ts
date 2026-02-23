import { Controller, Get, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.users.findAll()
  }
}
