export type AssessmentUserSummary = {
  id: string
  name: string
}

export type Assessment = {
  id: string
  height: number
  weight: number
  imc: number
  classification: string
  student: AssessmentUserSummary
  evaluator: AssessmentUserSummary
  createdAt: string
}

export type ListAssessmentsFilters = {
  studentId?: string
  idUsuarioAvaliacao?: string
}

export type CreateAssessmentInput = {
  studentId: string
  height: number
  weight: number
}

export type UpdateAssessmentInput = {
  height?: number
  weight?: number
}
