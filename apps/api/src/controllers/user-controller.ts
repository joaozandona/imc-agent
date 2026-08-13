import { Request, Response } from 'express'
import { sendError } from '../errors/send-error'
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../schemas/user-schema'
import { UserService } from '../services/user-service'

export class UserController {
  private userService = new UserService()

  list = async (req: Request, res: Response) => {
    const parsed = listUsersQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const users = await this.userService.list(
        {
          id: req.user!.id,
          role: req.user!.role,
        },
        parsed.data,
      )
      return res.json(users)
    } catch (error) {
      return sendError(res, error)
    }
  }

  getById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getById(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
      )
      return res.json(user)
    } catch (error) {
      return sendError(res, error)
    }
  }

  create = async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const user = await this.userService.create(
        { id: req.user!.id, role: req.user!.role },
        parsed.data,
      )
      return res.status(201).json(user)
    } catch (error) {
      return sendError(res, error)
    }
  }

  update = async (req: Request, res: Response) => {
    const parsed = updateUserSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const user = await this.userService.update(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
        parsed.data,
      )
      return res.json(user)
    } catch (error) {
      return sendError(res, error)
    }
  }

  delete = async (req: Request, res: Response) => {
    try {
      await this.userService.delete(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
      )
      return res.status(204).send()
    } catch (error) {
      return sendError(res, error)
    }
  }
}
