import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    })
  }

  validate(req: any, payload: any) {
    const authHeader = req.headers?.authorization || ''
    const refreshToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined

    return { ...payload, refreshToken }
  }
}
