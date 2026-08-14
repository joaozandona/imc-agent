import rateLimit from 'express-rate-limit'

const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
const max = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10

export const loginRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Try again later.',
  },
})
