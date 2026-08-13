'use client'

import { Alert, Box, Button, Stack, Text, Heading } from '@chakra-ui/react'

type UserFormLayoutProps = {
  title: string
  description: string
  error: string | null
  loading: boolean
  onCancel: () => void
  onSubmit: React.FormEventHandler
  children: React.ReactNode
}

export function UserFormLayout({
  title,
  description,
  error,
  loading,
  onCancel,
  onSubmit,
  children,
}: UserFormLayoutProps) {
  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      bg="white"
      borderWidth="1px"
      borderColor="blackAlpha.200"
      p={{ base: 6, md: 8 }}
      maxW="lg"
    >
      <Stack gap={6}>
        <Box>
          <Heading size="md" color="brand.fg" mb={2}>
            {title}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            {description}
          </Text>
        </Box>

        {error ? (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        ) : null}

        {children}

        <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
          <Button type="submit" colorPalette="brand" loading={loading}>
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
