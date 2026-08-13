import { z } from 'zod'

export const createAssessmentFormSchema = z.object({
  studentId: z.string().uuid('Selecione um aluno'),
  height: z
    .number({ message: 'Informe a altura' })
    .positive('A altura deve ser maior que zero'),
  weight: z
    .number({ message: 'Informe o peso' })
    .positive('O peso deve ser maior que zero'),
})

export const updateAssessmentFormSchema = z.object({
  height: z
    .number({ message: 'Informe a altura' })
    .positive('A altura deve ser maior que zero'),
  weight: z
    .number({ message: 'Informe o peso' })
    .positive('O peso deve ser maior que zero'),
})

export type CreateAssessmentFormData = z.infer<typeof createAssessmentFormSchema>
export type UpdateAssessmentFormData = z.infer<typeof updateAssessmentFormSchema>
