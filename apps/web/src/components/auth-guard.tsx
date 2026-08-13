'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Center, Spinner } from '@chakra-ui/react'
import { isAuthenticated } from '@/lib/auth-storage'

type AuthGuardProps = {
  children: React.ReactNode
  mode: 'protected' | 'guest'
}

export function AuthGuard({ children, mode }: AuthGuardProps) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const authenticated = isAuthenticated()

    if (mode === 'protected' && !authenticated) {
      router.replace('/login')
      return
    }

    if (mode === 'guest' && authenticated) {
      router.replace('/')
      return
    }

    setReady(true)
  }, [mode, router])

  if (!ready) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" color="teal.500" />
      </Center>
    )
  }

  return <>{children}</>
}
