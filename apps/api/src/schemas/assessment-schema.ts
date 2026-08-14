import { z } from 'zod'
import { paginationQuerySchema } from './pagination-schema'
import { sortOrderSchema } from './sort-schema'

export const createAssessmentSchema = z.object({
  studentId: z.string().uuid('studentId must be a valid UUID'),
  height: z.number().positive('Height must be greater than zero'),
  weight: z.number().positive('Weight must be greater than zero'),
})

export const updateAssessmentSchema = z.object({
  height: z.number().positive('Height must be greater than zero').optional(),
  weight: z.number().positive('Weight must be greater than zero').optional(),
})

export const assessmentSortBySchema = z
  .enum([
    'createdAt',
    'height',
    'weight',
    'imc',
    'classification',
    'student',
    'evaluator',
  ])
  .default('createdAt')

export const listAssessmentsQuerySchema = paginationQuerySchema.extend({
  studentId: z.string().uuid().optional(),
  idUsuarioAvaliacao: z.string().uuid().optional(),
  sortBy: assessmentSortBySchema,
  sortOrder: sortOrderSchema,
})

export type CreateAssessmentData = z.infer<typeof createAssessmentSchema>
export type UpdateAssessmentData = z.infer<typeof updateAssessmentSchema>
export type ListAssessmentsQuery = z.infer<typeof listAssessmentsQuerySchema>
export type AssessmentSortBy = z.infer<typeof assessmentSortBySchema>
