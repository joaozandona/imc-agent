import { api } from './api'
import type { ListUser, UserRole, UserStatus } from '@/types/user'
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

export type { ListUser }

export type UserSortBy = 'name' | 'username' | 'role' | 'status' | 'createdAt'

export type CreateUserInput = {
  name: string
  username: string
  password: string
  role: UserRole
  status?: UserStatus
}

export type UpdateUserInput = {
  name?: string
  username?: string
  password?: string
  role?: UserRole
  status?: UserStatus
}

export type ListUsersParams = PaginationParams &
  SortParams & {
    name?: string
    username?: string
    sortBy?: UserSortBy
  }

export async function listUsers(params: ListUsersParams = {}) {
  const { data } = await api.get<PaginatedResponse<ListUser>>('/users', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
      name: params.name || undefined,
      username: params.username || undefined,
      sortBy: params.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: params.sortOrder ?? DEFAULT_SORT_ORDER,
    },
  })
  return data
}

export async function getUser(id: string) {
  const { data } = await api.get<ListUser>(`/users/${id}`)
  return data
}

export async function createUser(input: CreateUserInput) {
  const { data } = await api.post<ListUser>('/users', input)
  return data
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { data } = await api.put<ListUser>(`/users/${id}`, input)
  return data
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`)
}
