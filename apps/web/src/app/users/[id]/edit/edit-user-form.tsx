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
import { updateUser } from '@/lib/users-api'
import type { ListUser } from '@/types/user'
import {
  updateUserFormSchema,
  UpdateUserFormData,
} from '@/schemas/user-form-schema'

type EditUserFormProps = {
  user: ListUser
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const [formError, setFormError] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'admin'
  const isProfessor = currentUser?.role === 'professor'
  const isStudent = user.role === 'aluno'

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      status: user.status,
      professorIds: user.professorIds ?? [],
      linkMyself: Boolean(user.isLinked),
    },
  })

  const selectedRole = useWatch({ control, name: 'role' })

  const saveMutation = useMutation({
    mutationFn: (data: UpdateUserFormData) => {
      const body: Parameters<typeof updateUser>[1] = {
        name: data.name,
        username: data.username,
        status: data.status,
      }

      if (data.password) {
        body.password = data.password
      }

      if (isAdmin) {
        body.role = data.role
        if (data.role === 'aluno') {
          body.professorIds = data.professorIds ?? []
        }
      }

      if (isProfessor && isStudent) {
        body.linkMyself = Boolean(data.linkMyself)
      }

      return updateUser(user.id, body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['users', user.id] })
      router.replace('/users')
    },
    onError: (error) => {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível atualizar o usuário.'),
      )
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    await saveMutation.mutateAsync(data)
  })

  return (
    <UserFormLayout
      title="Editar usuário"
      description={
        isAdmin
          ? 'Administradores podem editar qualquer perfil.'
          : 'Professores editam alunos e podem se vincular a eles.'
      }
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
        <Field.Label>Senha (deixe em branco para manter)</Field.Label>
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
      ) : null}

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
                selectedProfessors={user.professors ?? []}
                onChange={(professorIds) => field.onChange(professorIds)}
                placeholder="Digite o nome do professor"
              />
            )}
          />
        </Field.Root>
      ) : null}

      {isProfessor && isStudent ? (
        <Field.Root>
          <Controller
            name="linkMyself"
            control={control}
            render={({ field }) => (
              <Checkbox.Root
                checked={Boolean(field.value)}
                onCheckedChange={(details) => {
                  field.onChange(Boolean(details.checked))
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>Sou professor deste aluno</Checkbox.Label>
              </Checkbox.Root>
            )}
          />
        </Field.Root>
      ) : null}
    </UserFormLayout>
  )
}
