import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { AppDataSource } from '../database/data-source'
import { User, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import { LoginInput, RefreshTokenInput } from '../schemas/login-schema'
import { TokenService } from './token-service'

export class LoginService {
  private users = AppDataSource.getRepository(User)
  private tokenService = new TokenService()

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

    const accessToken = this.createAccessToken(user)
    const { refreshToken } = await this.tokenService.createRefreshToken(user.id)

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user),
    }
  }

  async refresh({ refreshToken }: RefreshTokenInput) {
    const storedToken = await this.tokenService.findValidRefreshToken(refreshToken)
    const user = await this.users.findOne({ where: { id: storedToken.userId } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    if (user.situacao === UserSituacao.INATIVO) {
      await this.tokenService.revokeRefreshToken(refreshToken)
      throw new AppError('INACTIVE_USER', 403, 'User is inactive')
    }

    const rotated = await this.tokenService.rotateRefreshToken(refreshToken)
    const accessToken = this.createAccessToken(user)

    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      user: this.toAuthUser(user),
    }
  }

  async logout({ refreshToken }: RefreshTokenInput) {
    await this.tokenService.revokeRefreshToken(refreshToken)
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10)
  }

  private createAccessToken(user: User) {
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new AppError('SERVER_MISCONFIGURED', 500, 'JWT secret is not configured')
    }

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
    }

    return jwt.sign(
      {
        sub: user.id,
        username: user.usuario,
        role: user.perfil,
      },
      secret,
      signOptions,
    )
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      name: user.nome,
      username: user.usuario,
      role: user.perfil,
      status: user.situacao,
    }
  }
}
