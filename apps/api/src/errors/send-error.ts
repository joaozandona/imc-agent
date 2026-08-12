import { Response } from 'express'
import { AppError } from './app-error'

export function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    })
  }

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  })
}
