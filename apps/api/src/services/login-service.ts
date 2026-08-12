import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { AppDataSource } from '../database/data-source'
import { User, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import { LoginInput } from '../schemas/login-schema'

export class LoginService {
  private users = AppDataSource.getRepository(User)

  async login({ username, password }: LoginInput) {
    const user = await this.users.findOne({ where: { usuario: username } })

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid username or password')
    }

    if (user.situacao === UserSituacao.INATIVO) {
      throw new AppError('INACTIVE_USER', 403, 'User is inactive')
    }

    const passwordMatches = await bcrypt.compare(password, user.senha)

    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid username or password')
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new AppError('SERVER_MISCONFIGURED', 500, 'JWT secret is not configured')
    }

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.usuario,
        role: user.perfil,
      },
      secret,
      signOptions,
    )

    return {
      token,
      user: {
        id: user.id,
        name: user.nome,
        username: user.usuario,
        role: user.perfil,
        status: user.situacao,
      },
    }
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10)
  }
}
