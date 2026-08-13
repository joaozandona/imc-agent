'use client'

import { Box, Button, Container, Flex, HStack, Link as ChakraLink } from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppBrandHeader } from '@/components/app-brand-header'
import { useCurrentUser } from '@/hooks/use-current-user'
import { logoutRequest } from '@/lib/auth-api'

type AppShellProps = {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title = 'Painel' }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useCurrentUser()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutRequest()
    } finally {
      router.replace('/login')
    }
  }

  const canManageUsers = user?.role === 'admin' || user?.role === 'professor'

  return (
    <Box minH="100vh" bg="brand.subtle">
      <Box
        bg="white"
        borderBottomWidth="1px"
        borderColor="blackAlpha.100"
        px={4}
        py={4}
      >
        <Container maxW="4xl">
          <Flex
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={4}
            direction={{ base: 'column', md: 'row' }}
          >
            <AppBrandHeader title={title} compact align="start" />

            <Flex
              align={{ base: 'stretch', sm: 'center' }}
              gap={4}
              direction={{ base: 'column', sm: 'row' }}
            >
              <HStack gap={4} flexWrap="wrap">
                <NavItem href="/" active={pathname === '/'}>
                  Início
                </NavItem>
                {canManageUsers ? (
                  <NavItem
                    href="/users"
                    active={pathname === '/users' || pathname.startsWith('/users/')}
                  >
                    Usuários
                  </NavItem>
                ) : null}
              </HStack>

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
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={10}>
        {children}
      </Container>
    </Box>
  )
}

function NavItem({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <ChakraLink
      asChild
      fontWeight={active ? 'semibold' : 'medium'}
      color={active ? 'brand.fg' : 'fg.muted'}
      textDecoration={active ? 'underline' : 'none'}
      textUnderlineOffset="4px"
      _hover={{ color: 'brand.fg' }}
    >
      <NextLink href={href}>{children}</NextLink>
    </ChakraLink>
  )
}
