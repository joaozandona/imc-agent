import { randomBytes } from 'crypto'
import { EntityManager, LessThan, MoreThan } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { UserToken } from '../database/entities/UserToken'
import { AppError } from '../errors/app-error'
import { hashToken } from '../utils/hash-token'
import { parseDurationToMs } from '../utils/parse-duration-to-ms'

export class TokenService {
  private tokens = AppDataSource.getRepository(UserToken)

  private getTokens(manager?: EntityManager) {
    return manager ? manager.getRepository(UserToken) : this.tokens
  }

  async createRefreshToken(userId: string, manager?: EntityManager) {
    const tokens = this.getTokens(manager)
    const refreshToken = randomBytes(48).toString('hex')
    const expiresIn = process.env.REFRESH_EXPIRES_IN || '7d'
    const expiresAt = new Date(Date.now() + parseDurationToMs(expiresIn))

    const token = tokens.create({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    })

    await tokens.save(token)

    return {
      refreshToken,
      expiresAt,
    }
  }

  async findValidRefreshToken(refreshToken: string, manager?: EntityManager) {
    const token = await this.getTokens(manager).findOne({
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

  async revokeRefreshToken(refreshToken: string, manager?: EntityManager) {
    const tokens = this.getTokens(manager)
    const token = await tokens.findOne({
      where: { tokenHash: hashToken(refreshToken) },
    })

    if (!token) {
      throw new AppError('REFRESH_TOKEN_INVALID', 401, 'Refresh token is invalid or expired')
    }

    await tokens.remove(token)
  }

  async revokeAllForUser(userId: string, manager?: EntityManager) {
    await this.getTokens(manager).delete({ userId })
  }

  async rotateRefreshToken(currentRefreshToken: string, manager?: EntityManager) {
    const run = async (tx: EntityManager) => {
      const current = await this.findValidRefreshToken(currentRefreshToken, tx)
      await tx.getRepository(UserToken).remove(current)
      return this.createRefreshToken(current.userId, tx)
    }

    if (manager) {
      return run(manager)
    }

    return AppDataSource.transaction(run)
  }

  async deleteExpiredTokens() {
    await this.tokens.delete({
      expiresAt: LessThan(new Date()),
    })
  }
}
