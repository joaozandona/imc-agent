'use client'

import { useEffect, useState } from 'react'
import { getStoredUser } from '@/lib/auth-storage'
import type { User } from '@/types/user'

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  return user
}
