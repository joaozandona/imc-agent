import { z } from 'zod'

const roleSchema = z.enum(['admin', 'professor', 'aluno'])
const statusSchema = z.enum(['ativo', 'inativo'])

export const createUserFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  username: z.string().min(1, 'Usuário é obrigatório').max(60),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: roleSchema,
  status: statusSchema,
})

export const updateUserFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  username: z.string().min(1, 'Usuário é obrigatório').max(60),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, {
      message: 'Senha deve ter no mínimo 6 caracteres',
    }),
  role: roleSchema,
  status: statusSchema,
})

export type CreateUserFormData = z.infer<typeof createUserFormSchema>
export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>
