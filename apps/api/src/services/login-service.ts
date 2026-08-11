import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../database/data-source'
import { User, UserSituacao } from '../database/entities/User'
import { LoginInput } from '../schemas/login-schema'

export class LoginService {
  private users = AppDataSource.getRepository(User)

  async login({ username, password }: LoginInput) {
    const user = await this.users.findOne({ where: { usuario: username } })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    if (user.situacao === UserSituacao.INATIVO) {
      throw new Error('Inactive user')
    }

    const passwordMatches = await bcrypt.compare(password, user.senha)

    if (!passwordMatches) {
      throw new Error('Invalid credentials')
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.usuario,
        role: user.perfil,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
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