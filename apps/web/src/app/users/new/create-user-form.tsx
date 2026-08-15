'use client'

import { Checkbox, Field, Input, NativeSelect } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { UserFormLayout } from '@/app/users/user-form-layout'
import { ProfessorMultiCombobox } from '@/components/professor-multi-combobox'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { createUser } from '@/lib/users-api'
import {
  createUserFormSchema,
  CreateUserFormData,
} from '@/schemas/user-form-schema'

export function CreateUserForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const [formError, setFormError] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      role: 'aluno',
      status: 'ativo',
      professorIds: [],
    },
  })

  const selectedRole = useWatch({ control, name: 'role' })

  const saveMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => {
      const role = isAdmin ? data.role : 'aluno'
      return createUser({
        name: data.name,
        username: data.username,
        password: data.password,
        role,
        status: data.status,
        professorIds:
          isAdmin && role === 'aluno' ? data.professorIds ?? [] : undefined,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      router.replace('/users')
    },
    onError: (error) => {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível criar o usuário.'),
      )
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    await saveMutation.mutateAsync(data)
  })

  return (
    <UserFormLayout
      title="Novo usuário"
      description="Incluir novo Aluno ou Professor."
      error={formError}
      loading={isSubmitting || saveMutation.isPending}
      onCancel={() => router.push('/users')}
      onSubmit={onSubmit}
    >
      <Field.Root invalid={Boolean(errors.name)}>
        <Field.Label>Nome</Field.Label>
        <Input {...register('name')} />
        {errors.name?.message ? (
          <Field.ErrorText>{errors.name.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

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
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password?.message ? (
          <Field.ErrorText>{errors.password.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

      {isAdmin ? (
        <Field.Root invalid={Boolean(errors.role)}>
          <Field.Label>Perfil</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field {...register('role')}>
              <option value="admin">Administrador</option>
              <option value="professor">Professor</option>
              <option value="aluno">Aluno</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
          {errors.role?.message ? (
            <Field.ErrorText>{errors.role.message}</Field.ErrorText>
          ) : null}
        </Field.Root>
      ) : (
        <input type="hidden" {...register('role')} value="aluno" />
      )}

      <Field.Root invalid={Boolean(errors.status)}>
        <Field.Label>Situação</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field {...register('status')}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </NativeSelect.Field>
        </NativeSelect.Root>
        {errors.status?.message ? (
          <Field.ErrorText>{errors.status.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

      {isAdmin && selectedRole === 'aluno' ? (
        <Field.Root>
          <Field.Label>Professores vinculados</Field.Label>
          <Controller
            name="professorIds"
            control={control}
            render={({ field }) => (
              <ProfessorMultiCombobox
                value={field.value ?? []}
                onChange={(professorIds) => field.onChange(professorIds)}
                placeholder="Digite o nome do professor"
              />
            )}
          />
        </Field.Root>
      ) : null}
    </UserFormLayout>
  )
}
