import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function redirectToSessionRefresh(): Promise<never> {
  const headerStore = await headers()
  const pathname = headerStore.get('x-pathname') || '/'
  const search = headerStore.get('x-search') || ''
  const next = `${pathname}${search}`

  redirect(`/api/auth/refresh?next=${encodeURIComponent(next)}`)
}

export function redirectToLogin(): never {
  redirect('/api/auth/logout?next=/login')
}
