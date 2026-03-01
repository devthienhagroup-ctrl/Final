import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

type RequestUser = {
  permissions?: string[]
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest()
    const user = req.user as RequestUser | undefined
    const current = new Set(user?.permissions ?? [])

    return required.every((perm) => current.has(perm))
  }
}
