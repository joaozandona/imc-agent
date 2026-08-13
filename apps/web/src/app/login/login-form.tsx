'use client'

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
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { loginRequest } from '@/lib/auth-api'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { LoginFormData, loginFormSchema } from '@/schemas/login-form-schema'

export function LoginForm() {
  const router = useRouter()
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
      await loginRequest(data.username, data.password)
      router.replace('/')
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'),
      )
    }
  })

  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      w="full"
      maxW="md"
      bg="white"
      borderWidth="1px"
      borderColor="blackAlpha.200"
      p={{ base: 6, md: 8 }}
      boxShadow="sm"
    >
      <Stack gap={6}>
        <Box>
          <Heading size="md" mb={2} color="brand.fg">
            Entrar na conta
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Use seu usuário e senha cadastrados no sistema.
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
          <Input autoComplete="username" {...register('username')} />
          {errors.username?.message ? (
            <Field.ErrorText>{errors.username.message}</Field.ErrorText>
          ) : null}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.password)}>
          <Field.Label>Senha</Field.Label>
          <Input
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password?.message ? (
            <Field.ErrorText>{errors.password.message}</Field.ErrorText>
          ) : null}
        </Field.Root>

        <Button type="submit" loading={isSubmitting} colorPalette="brand" size="lg">
          Entrar
        </Button>
      </Stack>
    </Box>
  )
}
