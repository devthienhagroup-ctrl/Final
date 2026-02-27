import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalAccessTokenGuard extends AuthGuard('jwt-access') {
  handleRequest(err: any, user: any) {
    if (err || !user) return null
    return user
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context)
  }
}
