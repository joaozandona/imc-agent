import { z } from 'zod'

export const createAssessmentSchema = z.object({
  studentId: z.string().uuid('studentId must be a valid UUID'),
  height: z.number().positive('Height must be greater than zero'),
  weight: z.number().positive('Weight must be greater than zero'),
})

export const updateAssessmentSchema = z.object({
  height: z.number().positive('Height must be greater than zero').optional(),
  weight: z.number().positive('Weight must be greater than zero').optional(),
})

export const listAssessmentsQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  idUsuarioAvaliacao: z.string().uuid().optional(),
})

export type CreateAssessmentData = z.infer<typeof createAssessmentSchema>
export type UpdateAssessmentData = z.infer<typeof updateAssessmentSchema>
export type ListAssessmentsQuery = z.infer<typeof listAssessmentsQuerySchema>
