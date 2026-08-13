'use client'

import { Box, Button, Container, Flex, Stack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppBrandHeader } from '@/components/app-brand-header'
import { AuthGuard } from '@/components/auth-guard'
import { logoutRequest } from '@/lib/auth-api'
import { AuthUser, getStoredUser } from '@/lib/auth-storage'

export function HomePanel() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutRequest()
    } finally {
      router.replace('/login')
    }
  }

  return (
    <AuthGuard mode="protected">
      <Box minH="100vh" bg="brand.subtle">
        <Box
          bg="white"
          borderBottomWidth="1px"
          borderColor="blackAlpha.100"
          px={4}
          py={4}
        >
          <Container maxW="3xl">
            <Flex
              align={{ base: 'stretch', sm: 'center' }}
              justify="space-between"
              gap={4}
              direction={{ base: 'column', sm: 'row' }}
            >
              <AppBrandHeader title="Painel" compact align="start" />
              <Button
                alignSelf={{ base: 'stretch', sm: 'center' }}
                variant="outline"
                colorPalette="softRed"
                color="softRed.fg"
                borderColor="softRed.emphasized"
                loading={loggingOut}
                onClick={handleLogout}
              >
                Sair
              </Button>
            </Flex>
          </Container>
        </Box>

        <Container maxW="3xl" py={10}>
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
                minha conta
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
          </Stack>
        </Container>
      </Box>
    </AuthGuard>
  )
}
