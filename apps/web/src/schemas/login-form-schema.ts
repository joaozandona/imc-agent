import { z } from 'zod'

export const loginFormSchema = z.object({
  username: z.string().min(1, 'Usuario é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
