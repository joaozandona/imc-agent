import { api } from './api'
import type {
  Assessment,
  CreateAssessmentInput,
  ListAssessmentsFilters,
  UpdateAssessmentInput,
} from '@/types/assessment'
import type {
  PaginatedResponse,
  PaginationParams,
  SortParams,
} from '@/types/pagination'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/types/pagination'

export type { Assessment }

export type AssessmentSortBy =
  | 'createdAt'
  | 'height'
  | 'weight'
  | 'imc'
  | 'classification'
  | 'student'
  | 'evaluator'

export async function listAssessments(
  filters: ListAssessmentsFilters &
    PaginationParams &
    SortParams & { sortBy?: AssessmentSortBy } = {},
) {
  const { data } = await api.get<PaginatedResponse<Assessment>>('/assessments', {
    params: {
      studentId: filters.studentId || undefined,
      idUsuarioAvaliacao: filters.idUsuarioAvaliacao || undefined,
      page: filters.page ?? 1,
      limit: filters.limit ?? DEFAULT_PAGE_SIZE,
      sortBy: filters.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: filters.sortOrder ?? DEFAULT_SORT_ORDER,
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
