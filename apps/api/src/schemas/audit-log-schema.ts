import { z } from 'zod'
import { paginationQuerySchema } from './pagination-schema'

export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().trim().min(1).optional(),
  entity: z.string().trim().min(1).optional(),
  actorUsername: z.string().trim().min(1).optional(),
})

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>
