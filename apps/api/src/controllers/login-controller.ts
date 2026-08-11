import { Request, Response } from 'express'
import { LoginService } from '../services/login-service'
import { loginSchema } from '../schemas/login-schema'

export class LoginController {
  private loginService = new LoginService()

  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados inválidos',
        issues: parsed.error.issues,
      })
    }

    try {
      const result = await this.loginService.login(parsed.data)
      return res.json(result)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'Unexpected error'

      if (code === 'Inactive user') {
        return res.status(403).json({ message: 'Usuário inativo' })
      }

      if (code === 'JWT_SECRET is not configured') {
        return res.status(500).json({ message: 'Erro de configuração do servidor' })
      }

      return res.status(401).json({ message: 'Credenciais inválidas' })
    }
  }

  me = async (req: Request, res: Response) => {
    return res.json({ user: req.user })
  }
}