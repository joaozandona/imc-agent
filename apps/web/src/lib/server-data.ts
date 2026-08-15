import { serverFetch } from '@/lib/server-api'
import type { Assessment } from '@/types/assessment'
import type { AuditLog } from '@/types/audit-log'
import type { ListUser } from '@/types/user'
import type { PaginatedResponse } from '@/types/pagination'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/types/pagination'
import type { ListUsersParams, UserSortBy } from '@/lib/users-api'
import type { AssessmentSortBy } from '@/lib/assessments-api'
import type { ListAssessmentsFilters } from '@/types/assessment'
import type { PaginationParams, SortParams } from '@/types/pagination'
import type { ListAuditLogsParams } from '@/lib/audit-logs-api'

export async function listUsersServer(params: ListUsersParams = {}) {
  return serverFetch<PaginatedResponse<ListUser>>('/users', {
    searchParams: {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? DEFAULT_PAGE_SIZE),
      name: params.name,
      username: params.username,
      sortBy: params.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: params.sortOrder ?? DEFAULT_SORT_ORDER,
    },
  })
}

export async function getUserServer(id: string) {
  return serverFetch<ListUser>(`/users/${id}`)
}

export async function listAssessmentsServer(
  filters: ListAssessmentsFilters &
    PaginationParams &
    SortParams & { sortBy?: AssessmentSortBy } = {},
) {
  return serverFetch<PaginatedResponse<Assessment>>('/assessments', {
    searchParams: {
      studentId: filters.studentId,
      idUsuarioAvaliacao: filters.idUsuarioAvaliacao,
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? DEFAULT_PAGE_SIZE),
      sortBy: (filters.sortBy ?? DEFAULT_SORT_BY) as string,
      sortOrder: filters.sortOrder ?? DEFAULT_SORT_ORDER,
    },
  })
}

export async function getAssessmentServer(id: string) {
  return serverFetch<Assessment>(`/assessments/${id}`)
}

export async function listAuditLogsServer(params: ListAuditLogsParams = {}) {
  return serverFetch<PaginatedResponse<AuditLog>>('/audit-logs', {
    searchParams: {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? DEFAULT_PAGE_SIZE),
      action: params.action,
      entity: params.entity,
      actorUsername: params.actorUsername,
    },
  })
}

export type { UserSortBy, AssessmentSortBy }
