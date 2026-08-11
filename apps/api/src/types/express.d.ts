import { UserPerfil } from '../database/entities/User'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        role: UserPerfil
      }
    }
  }
}

export {}