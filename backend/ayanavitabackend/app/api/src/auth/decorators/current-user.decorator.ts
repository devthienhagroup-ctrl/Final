import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export type JwtUser = { sub: number; email?: string; role: string; scopeType?: string | null; permissions?: string[]; iat?: number; exp?: number }

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req.user as JwtUser
  },
)
