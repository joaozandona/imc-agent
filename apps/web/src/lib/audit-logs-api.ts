import { api } from './api'
import type { AuditLog } from '@/types/audit-log'
import type {
  PaginatedResponse,
  PaginationParams,
} from '@/types/pagination'
import { DEFAULT_PAGE_SIZE } from '@/types/pagination'

export type ListAuditLogsParams = PaginationParams & {
  action?: string
  entity?: string
  actorUsername?: string
}

export async function listAuditLogs(params: ListAuditLogsParams = {}) {
  const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
      action: params.action || undefined,
      entity: params.entity || undefined,
      actorUsername: params.actorUsername || undefined,
    },
  })
  return data
}
