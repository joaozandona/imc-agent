import { TokenService } from '../services/token-service'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function startExpiredTokenCleanup(intervalMs = ONE_DAY_MS) {
  const tokenService = new TokenService()

  const run = async () => {
    try {
      await tokenService.deleteExpiredTokens()
    } catch (error) {
      console.error('Failed to delete expired refresh tokens', error)
    }
  }

  void run()

  const timer = setInterval(() => {
    void run()
  }, intervalMs)

  timer.unref()

  return timer
}
