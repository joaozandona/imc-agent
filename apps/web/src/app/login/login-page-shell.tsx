'use client'

import { Box, Container, Stack } from '@chakra-ui/react'
import { AppBrandHeader } from '@/components/app-brand-header'
import { LoginForm } from './login-form'

export function LoginPageShell() {
  return (
    <Box minH="100vh" bg="brand.subtle">
      <Box h="1" bg="brand.solid" />
      <Container maxW="lg" py={{ base: 10, md: 16 }}>
        <Stack gap={8} align="center">
          <AppBrandHeader compact />
          <LoginForm />
        </Stack>
      </Container>
    </Box>
  )
}
