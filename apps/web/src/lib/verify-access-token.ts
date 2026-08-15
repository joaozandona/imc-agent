import { errors, jwtVerify } from 'jose'
import type { User, UserRole, UserStatus } from '@/types/user'

const ACCESS_TOKEN_ALGORITHMS = ['HS256'] as const

const USER_ROLES = new Set<UserRole>(['admin', 'professor', 'aluno'])
const USER_STATUSES = new Set<UserStatus>(['ativo', 'inativo'])

export type VerifyAccessTokenResult =
  | { status: 'ok'; user: User }
  | { status: 'expired' }
  | { status: 'invalid' }

function readStringClaim(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export async function verifyAccessToken(
  token: string,
): Promise<VerifyAccessTokenResult> {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    console.error('JWT_SECRET is not configured for the web app')
    return { status: 'invalid' }
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: [...ACCESS_TOKEN_ALGORITHMS] },
    )

    const claims = payload as Record<string, unknown>
    const id = typeof payload.sub === 'string' && payload.sub ? payload.sub : null
    const username = readStringClaim(claims, 'username')
    const name = readStringClaim(claims, 'name')
    const role = readStringClaim(claims, 'role')
    const status = readStringClaim(claims, 'status')

    if (
      !id ||
      !username ||
      !name ||
      !role ||
      !status ||
      !USER_ROLES.has(role as UserRole) ||
      !USER_STATUSES.has(status as UserStatus)
    ) {
      return { status: 'invalid' }
    }

    return {
      status: 'ok',
      user: {
        id,
        username,
        name,
        role: role as UserRole,
        status: status as UserStatus,
      },
    }
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return { status: 'expired' }
    }

    return { status: 'invalid' }
  }
}
