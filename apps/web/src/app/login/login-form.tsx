'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginRequest } from '@/lib/auth-api'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { useAuth } from '@/providers/auth-provider'
import { LoginFormData, loginFormSchema } from '@/schemas/login-form-schema'

export function LoginForm() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)

    try {
      const result = await loginRequest(data.username, data.password)
      setUser(result.user)
      router.replace('/')
      router.refresh()
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'),
      )
    }
  })

  return (
    <Box
      w="full"
      maxW="md"
      bg="white"
      borderWidth="1px"
      borderColor="blackAlpha.200"
      borderTopWidth="4px"
      borderTopColor="brand.solid"
      p={{ base: 6, md: 8 }}
      shadow="sm"
    >
      <Stack gap={6} as="form" onSubmit={onSubmit}>
        <Box>
          <Heading size="lg" color="brand.fg" mb={2}>
            Entrar
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Use seu usuário e senha para acessar o painel.
          </Text>
        </Box>

        {formError ? (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{formError}</Alert.Title>
          </Alert.Root>
        ) : null}

        <Field.Root invalid={Boolean(errors.username)}>
          <Field.Label>Usuário</Field.Label>
          <Input {...register('username')} autoComplete="username" />
          {errors.username?.message ? (
            <Field.ErrorText>{errors.username.message}</Field.ErrorText>
          ) : null}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.password)}>
          <Field.Label>Senha</Field.Label>
          <Input
            type="password"
            {...register('password')}
            autoComplete="current-password"
          />
          {errors.password?.message ? (
            <Field.ErrorText>{errors.password.message}</Field.ErrorText>
          ) : null}
        </Field.Root>

        <Button type="submit" colorPalette="brand" loading={isSubmitting}>
          Entrar
        </Button>
      </Stack>
    </Box>
  )
}
