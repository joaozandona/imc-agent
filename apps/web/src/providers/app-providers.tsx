'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/providers/auth-provider'
import { system } from '@/theme/system'
import type { User } from '@/types/user'

type AppProvidersProps = {
  children: React.ReactNode
  initialUser: User | null
}

export function AppProviders({ children, initialUser }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
