'use client'

import { Box, Button, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { useCurrentUser } from '@/hooks/use-current-user'

export function HomePanel() {
  const user = useCurrentUser()
  const canManageUsers = user?.role === 'admin' || user?.role === 'professor'

  return (
    <AuthGuard mode="protected">
      <AppShell title="Painel">
        <Stack gap={6}>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="brand.fg"
              textTransform="uppercase"
              letterSpacing="0.08em"
              mb={2}
            >
              Sessão atual
            </Text>
          </Box>

          {user ? (
            <Box
              bg="white"
              borderWidth="1px"
              borderColor="blackAlpha.200"
              borderLeftWidth="4px"
              borderLeftColor="brand.solid"
              p={5}
            >
              <Stack gap={2}>
                <Text>
                  <strong>Nome:</strong> {user.name}
                </Text>
                <Text>
                  <strong>Usuário:</strong> {user.username}
                </Text>
                <Text>
                  <strong>Perfil:</strong> {user.role}
                </Text>
              </Stack>
            </Box>
          ) : null}

          {canManageUsers ? (
            <Button asChild colorPalette="brand" alignSelf="flex-start">
              <Link href="/users">Ir para usuários</Link>
            </Button>
          ) : null}
        </Stack>
      </AppShell>
    </AuthGuard>
  )
}
