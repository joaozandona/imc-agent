import { api } from './api'
import type { ListUser, UserRole, UserStatus } from '@/types/user'

export type { ListUser }

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

export async function listUsers() {
  const { data } = await api.get<ListUser[]>('/users')
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
