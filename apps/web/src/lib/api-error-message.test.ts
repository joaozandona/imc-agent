import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api-error-message'

describe('getApiErrorMessage', () => {
  it('maps known API error codes to Portuguese messages', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { code: 'INVALID_CREDENTIALS' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
    }

    expect(getApiErrorMessage(error)).toBe('Usuario ou senha inválidos')
  })

  it('falls back for unknown errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Falha')).toBe('Falha')
  })
})
