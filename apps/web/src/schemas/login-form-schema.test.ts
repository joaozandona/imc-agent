import { describe, expect, it } from 'vitest'
import { loginFormSchema } from './login-form-schema'

describe('loginFormSchema', () => {
  it('accepts filled credentials', () => {
    const result = loginFormSchema.safeParse({
      username: 'admin',
      password: 'admin123',
    })

    expect(result.success).toBe(true)
  })

  it('requires username and password', () => {
    const result = loginFormSchema.safeParse({
      username: '',
      password: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Usuario é obrigatório')
      expect(messages).toContain('Senha é obrigatória')
    }
  })
})
