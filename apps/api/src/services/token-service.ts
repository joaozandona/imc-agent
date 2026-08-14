import { randomBytes } from 'crypto'
import { LessThan, MoreThan } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { UserToken } from '../database/entities/UserToken'
import { AppError } from '../errors/app-error'
import { hashToken } from '../utils/hash-token'
import { parseDurationToMs } from '../utils/parse-duration-to-ms'

export class TokenService {
  private tokens = AppDataSource.getRepository(UserToken)

  async createRefreshToken(userId: string) {
    const refreshToken = randomBytes(48).toString('hex')
    const expiresIn = process.env.REFRESH_EXPIRES_IN || '7d'
    const expiresAt = new Date(Date.now() + parseDurationToMs(expiresIn))

    const token = this.tokens.create({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    })

    await this.tokens.save(token)

    return {
      refreshToken,
      expiresAt,
    }
  }

  async findValidRefreshToken(refreshToken: string) {
    const token = await this.tokens.findOne({
      where: {
        tokenHash: hashToken(refreshToken),
        expiresAt: MoreThan(new Date()),
      },
    })

    if (!token) {
      throw new AppError('REFRESH_TOKEN_INVALID', 401, 'Refresh token is invalid or expired')
    }

    return token
  }

  async revokeRefreshToken(refreshToken: string) {
    const token = await this.tokens.findOne({
      where: { tokenHash: hashToken(refreshToken) },
    })

    if (!token) {
      throw new AppError('REFRESH_TOKEN_INVALID', 401, 'Refresh token is invalid or expired')
    }

    await this.tokens.remove(token)
  }

  async revokeAllForUser(userId: string) {
    await this.tokens.delete({ userId })
  }

  async rotateRefreshToken(currentRefreshToken: string) {
    const current = await this.findValidRefreshToken(currentRefreshToken)
    await this.tokens.remove(current)

    return this.createRefreshToken(current.userId)
  }

  async deleteExpiredTokens() {
    await this.tokens.delete({
      expiresAt: LessThan(new Date()),
    })
  }
}
