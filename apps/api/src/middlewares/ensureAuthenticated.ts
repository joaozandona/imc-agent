import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserPerfil } from '../database/entities/User'

type TokenPayload = {
  sub: string
  username: string
  role: UserPerfil
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({
      code: 'TOKEN_MISSING',
      message: 'Authorization token was not provided',
    })
  }

  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      code: 'TOKEN_INVALID',
      message: 'Authorization token format is invalid',
    })
  }

  const secret = process.env.JWT_SECRET

  if (!secret) {
    return res.status(500).json({
      code: 'SERVER_MISCONFIGURED',
      message: 'JWT secret is not configured',
    })
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload

    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
    }

    return next()
  } catch {
    return res.status(401).json({
      code: 'TOKEN_INVALID',
      message: 'Authorization token is invalid or expired',
    })
  }
}
