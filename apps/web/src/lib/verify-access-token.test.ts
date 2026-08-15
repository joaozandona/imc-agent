/**
 * @vitest-environment node
 */
import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { verifyAccessToken } from './verify-access-token'

const secret = 'test-jwt-secret-for-web'
const keyFor = (value: string) => new TextEncoder().encode(value)

async function signAccessToken(
  claims: {
    sub: string
    username?: string
    name?: string
    role?: string
    status?: string
  },
  options?: { expiresIn?: string; secret?: string },
) {
  const { sub, ...payload } = claims

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setExpirationTime(options?.expiresIn ?? '15m')
    .sign(keyFor(options?.secret ?? secret))
}

describe('verifyAccessToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = secret
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  it('returns the user from a valid access token', async () => {
    const token = await signAccessToken({
      sub: 'user-1',
      username: 'admin',
      name: 'Admin',
      role: 'admin',
      status: 'ativo',
    })

    await expect(verifyAccessToken(token)).resolves.toEqual({
      status: 'ok',
      user: {
        id: 'user-1',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        status: 'ativo',
      },
    })
  })

  it('returns expired when the token is past exp', async () => {
    const token = await signAccessToken(
      {
        sub: 'user-1',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        status: 'ativo',
      },
      { expiresIn: '0s' },
    )

    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect(verifyAccessToken(token)).resolves.toEqual({
      status: 'expired',
    })
  })

  it('rejects forged tokens signed with another secret', async () => {
    const token = await signAccessToken(
      {
        sub: 'user-1',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        status: 'ativo',
      },
      { secret: 'attacker-secret' },
    )

    await expect(verifyAccessToken(token)).resolves.toEqual({
      status: 'invalid',
    })
  })

  it('rejects tokens missing required claims', async () => {
    const token = await signAccessToken({
      sub: 'user-1',
      username: 'admin',
      role: 'admin',
      status: 'ativo',
    })

    await expect(verifyAccessToken(token)).resolves.toEqual({
      status: 'invalid',
    })
  })

  it('rejects when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET

    await expect(verifyAccessToken('anything')).resolves.toEqual({
      status: 'invalid',
    })
  })
})
