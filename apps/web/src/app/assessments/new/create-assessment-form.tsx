'use client'

import { Field, Input, NativeSelect, Spinner, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AssessmentFormLayout } from '@/app/assessments/assessment-form-layout'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { createAssessment } from '@/lib/assessments-api'
import { listUsers } from '@/lib/users-api'
import { SELECT_PAGE_SIZE } from '@/types/pagination'
import {
  createAssessmentFormSchema,
  CreateAssessmentFormData,
} from '@/schemas/assessment-form-schema'

export function CreateAssessmentForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users', { page: 1, limit: SELECT_PAGE_SIZE, purpose: 'select' }],
    queryFn: () => listUsers({ page: 1, limit: SELECT_PAGE_SIZE }),
  })

  const activeStudents = useMemo(
    () =>
      (usersQuery.data?.data ?? []).filter(
        (user) => user.role === 'aluno' && user.status === 'ativo',
      ),
    [usersQuery.data],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssessmentFormData>({
    resolver: zodResolver(createAssessmentFormSchema),
    defaultValues: {
      studentId: '',
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: CreateAssessmentFormData) => createAssessment(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assessments'] })
      router.replace('/assessments')
    },
    onError: (error) => {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível criar a avaliação.'),
      )
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    await saveMutation.mutateAsync(data)
  })

  if (usersQuery.isLoading) {
    return <Spinner size="lg" color="brand.solid" />
  }

  if (usersQuery.isError) {
    return (
      <Text color="fg.error">
        {getApiErrorMessage(usersQuery.error, 'Não foi possível carregar alunos.')}
      </Text>
    )
  }

  return (
    <AssessmentFormLayout
      title="Nova avaliação"
      description="Informe altura (metros) e peso (kg). O IMC e a classificação são calculados automaticamente."
      error={formError}
      loading={isSubmitting || saveMutation.isPending}
      onCancel={() => router.push('/assessments')}
      onSubmit={onSubmit}
    >
      <Field.Root invalid={Boolean(errors.studentId)}>
        <Field.Label>Aluno</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field {...register('studentId')}>
            <option value="">Selecione</option>
            {activeStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        {errors.studentId?.message ? (
          <Field.ErrorText>{errors.studentId.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.height)}>
        <Field.Label>Altura (m)</Field.Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Ex: 1.75"
          {...register('height', { valueAsNumber: true })}
        />
        {errors.height?.message ? (
          <Field.ErrorText>{errors.height.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.weight)}>
        <Field.Label>Peso (kg)</Field.Label>
        <Input
          type="number"
          step="0.1"
          placeholder="Ex: 70.5"
          {...register('weight', { valueAsNumber: true })}
        />
        {errors.weight?.message ? (
          <Field.ErrorText>{errors.weight.message}</Field.ErrorText>
        ) : null}
      </Field.Root>
    </AssessmentFormLayout>
  )
}
