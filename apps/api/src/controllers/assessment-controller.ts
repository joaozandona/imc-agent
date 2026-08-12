import { Request, Response } from 'express'
import { sendError } from '../errors/send-error'
import {
  createAssessmentSchema,
  listAssessmentsQuerySchema,
  updateAssessmentSchema,
} from '../schemas/assessment-schema'
import { AssessmentService } from '../services/assessment-service'

export class AssessmentController {
  private assessmentService = new AssessmentService()

  list = async (req: Request, res: Response) => {
    const parsed = listAssessmentsQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const assessments = await this.assessmentService.list(
        { id: req.user!.id, role: req.user!.role },
        parsed.data,
      )
      return res.json(assessments)
    } catch (error) {
      return sendError(res, error)
    }
  }

  getById = async (req: Request, res: Response) => {
    try {
      const assessment = await this.assessmentService.getById(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
      )
      return res.json(assessment)
    } catch (error) {
      return sendError(res, error)
    }
  }

  create = async (req: Request, res: Response) => {
    const parsed = createAssessmentSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const assessment = await this.assessmentService.create(
        { id: req.user!.id, role: req.user!.role },
        parsed.data,
      )
      return res.status(201).json(assessment)
    } catch (error) {
      return sendError(res, error)
    }
  }

  update = async (req: Request, res: Response) => {
    const parsed = updateAssessmentSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        issues: parsed.error.issues,
      })
    }

    try {
      const assessment = await this.assessmentService.update(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
        parsed.data,
      )
      return res.json(assessment)
    } catch (error) {
      return sendError(res, error)
    }
  }

  delete = async (req: Request, res: Response) => {
    try {
      await this.assessmentService.delete(
        { id: req.user!.id, role: req.user!.role },
        String(req.params.id),
      )
      return res.status(204).send()
    } catch (error) {
      return sendError(res, error)
    }
  }
}
