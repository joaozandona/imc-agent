export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export const DEFAULT_PAGE_SIZE = 20
export const SELECT_PAGE_SIZE = 100
