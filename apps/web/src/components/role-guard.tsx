'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Center, Spinner } from '@chakra-ui/react'
import { getStoredUser } from '@/lib/auth-storage'
import type { UserRole } from '@/types/user'

type RoleGuardProps = {
  children: React.ReactNode
  allow: UserRole[]
}

export function RoleGuard({ children, allow }: RoleGuardProps) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const allowedRoles = allow.join(',')

  useEffect(() => {
    const user = getStoredUser()
    const roles = allowedRoles.split(',') as UserRole[]

    if (!user || !roles.includes(user.role)) {
      router.replace('/')
      return
    }

    setReady(true)
  }, [allowedRoles, router])

  if (!ready) {
    return (
      <Center minH="40vh">
        <Spinner size="lg" color="brand.solid" />
      </Center>
    )
  }

  return <>{children}</>
}
