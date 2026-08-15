import { z } from 'zod'
import { paginationQuerySchema } from './pagination-schema'
import { sortOrderSchema } from './sort-schema'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  username: z.string().min(1, 'Usuario é obrigatório').max(60),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'professor', 'aluno']),
  status: z.enum(['ativo', 'inativo']).optional().default('ativo'),
  professorIds: z.array(z.string().uuid()).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  username: z.string().min(1).max(60).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'professor', 'aluno']).optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
  professorIds: z.array(z.string().uuid()).optional(),
  linkMyself: z.boolean().optional(),
})

export const userSortBySchema = z
  .enum(['name', 'username', 'role', 'status', 'createdAt'])
  .default('createdAt')

export const listUsersQuerySchema = paginationQuerySchema.extend({
  name: z.string().trim().optional(),
  username: z.string().trim().optional(),
  role: z.enum(['admin', 'professor', 'aluno']).optional(),
  sortBy: userSortBySchema,
  sortOrder: sortOrderSchema,
})

export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UserSortBy = z.infer<typeof userSortBySchema>
