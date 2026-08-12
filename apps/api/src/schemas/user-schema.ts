import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  username: z.string().min(1, 'Usuario é obrigatório').max(60),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'professor', 'aluno']),
  status: z.enum(['ativo', 'inativo']).optional().default('ativo'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  username: z.string().min(1).max(60).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'professor', 'aluno']).optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
})

export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
