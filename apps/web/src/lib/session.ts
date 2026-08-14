import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth-cookies'
import type { User, UserRole } from '@/types/user'

export async function requireSessionUser(roles?: UserRole[]): Promise<User> {
  const user = await getUserFromCookies()

  if (!user) {
    redirect('/login')
  }

  if (roles && !roles.includes(user.role)) {
    redirect('/')
  }

  return user
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
