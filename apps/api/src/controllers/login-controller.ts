import { Request, Response } from 'express'
import { sendError } from '../errors/send-error'
import { loginSchema, refreshTokenSchema } from '../schemas/login-schema'
import { LoginService } from '../services/login-service'

export class LoginController {
  private loginService = new LoginService()

  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const result = await this.loginService.login(parsed.data)
      return res.json(result)
    } catch (error) {
      return sendError(res, error)
    }
  }

  refresh = async (req: Request, res: Response) => {
    const parsed = refreshTokenSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const result = await this.loginService.refresh(parsed.data)
      return res.json(result)
    } catch (error) {
      return sendError(res, error)
    }
  }

  logout = async (req: Request, res: Response) => {
    const parsed = refreshTokenSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      await this.loginService.logout(parsed.data)
      return res.status(204).send()
    } catch (error) {
      return sendError(res, error)
    }
  }

  me = async (req: Request, res: Response) => {
    return res.json({ user: req.user })
  }
}
