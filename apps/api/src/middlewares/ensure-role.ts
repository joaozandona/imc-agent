import { NextFunction, Request, Response } from 'express'
import { UserPerfil } from '../database/entities/User'

export function ensureRole(...allowedRoles: UserPerfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: 'User is not authenticated',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      })
    }

    return next()
  }
}
