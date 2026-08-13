import { api } from './api'
import type {
  Assessment,
  CreateAssessmentInput,
  ListAssessmentsFilters,
  UpdateAssessmentInput,
} from '@/types/assessment'

export type { Assessment }

export async function listAssessments(filters: ListAssessmentsFilters = {}) {
  const { data } = await api.get<Assessment[]>('/assessments', {
    params: {
      studentId: filters.studentId || undefined,
      idUsuarioAvaliacao: filters.idUsuarioAvaliacao || undefined,
    },
  })
  return data
}

export async function getAssessment(id: string) {
  const { data } = await api.get<Assessment>(`/assessments/${id}`)
  return data
}

export async function createAssessment(input: CreateAssessmentInput) {
  const { data } = await api.post<Assessment>('/assessments', input)
  return data
}

export async function updateAssessment(id: string, input: UpdateAssessmentInput) {
  const { data } = await api.put<Assessment>(`/assessments/${id}`, input)
  return data
}

export async function deleteAssessment(id: string) {
  await api.delete(`/assessments/${id}`)
}
