import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Usuario é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
