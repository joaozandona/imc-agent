import { z } from 'zod'

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

export type SortOrder = z.infer<typeof sortOrderSchema>

export function toTypeOrmOrder(sortOrder: SortOrder): 'ASC' | 'DESC' {
  return sortOrder === 'asc' ? 'ASC' : 'DESC'
}
