import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../database/data-source'
import { User, UserSituacao } from '../database/entities/User'
import { TokenService } from '../services/token-service'

type TokenPayload = {
  sub: string
  username: string
  role: string
}

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload

    const users = AppDataSource.getRepository(User)
    const user = await users.findOne({ where: { id: decoded.sub } })

    if (!user) {
      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user was not found',
      })
    }

    if (user.situacao === UserSituacao.INATIVO) {
      const tokenService = new TokenService()
      await tokenService.revokeAllForUser(user.id)

      return res.status(403).json({
        code: 'INACTIVE_USER',
        message: 'User is inactive',
      })
    }

    req.user = {
      id: user.id,
      username: user.usuario,
      role: user.perfil,
    }

    return next()
  } catch {
    return res.status(401).json({
      code: 'TOKEN_INVALID',
      message: 'Authorization token is invalid or expired',
    })
  }
}
