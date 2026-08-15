import { Request, Response } from 'express'
import { sendError } from '../errors/send-error'
import { listAuditLogsQuerySchema } from '../schemas/audit-log-schema'
import { AuditService } from '../services/audit-service'

export class AuditLogController {
  private auditService = new AuditService()

  list = async (req: Request, res: Response) => {
    const parsed = listAuditLogsQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const logs = await this.auditService.list(
        {
          id: req.user!.id,
          role: req.user!.role,
        },
        parsed.data,
      )
      return res.json(logs)
    } catch (error) {
      return sendError(res, error)
    }
  }
}
