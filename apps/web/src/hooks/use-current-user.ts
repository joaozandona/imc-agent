'use client'

import { useAuth } from '@/providers/auth-provider'
import type { User } from '@/types/user'

export function useCurrentUser(): User | null {
  return useAuth().user
}
