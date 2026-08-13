'use client'

import { Field, Input, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AssessmentFormLayout } from '@/app/assessments/assessment-form-layout'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { updateAssessment } from '@/lib/assessments-api'
import type { Assessment } from '@/types/assessment'
import {
  updateAssessmentFormSchema,
  UpdateAssessmentFormData,
} from '@/schemas/assessment-form-schema'

type EditAssessmentFormProps = {
  assessment: Assessment
  studentName?: string
}

export function EditAssessmentForm({
  assessment,
  studentName,
}: EditAssessmentFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAssessmentFormData>({
    resolver: zodResolver(updateAssessmentFormSchema),
    defaultValues: {
      height: assessment.height,
      weight: assessment.weight,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: UpdateAssessmentFormData) =>
      updateAssessment(assessment.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assessments'] })
      await queryClient.invalidateQueries({
        queryKey: ['assessments', assessment.id],
      })
      router.replace('/assessments')
    },
    onError: (error) => {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível atualizar a avaliação.'),
      )
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    await saveMutation.mutateAsync(data)
  })

  return (
    <AssessmentFormLayout
      title="Editar avaliação"
      description="Altere altura e peso. O IMC e a classificação serão recalculados."
      error={formError}
      loading={isSubmitting || saveMutation.isPending}
      onCancel={() => router.push('/assessments')}
      onSubmit={onSubmit}
    >
      {studentName ? (
        <Text fontSize="sm" color="fg.muted">
          Aluno: <strong>{studentName}</strong>
        </Text>
      ) : null}

      <Field.Root invalid={Boolean(errors.height)}>
        <Field.Label>Altura (m)</Field.Label>
        <Input type="number" step="0.01" {...register('height', { valueAsNumber: true })} />
        {errors.height?.message ? (
          <Field.ErrorText>{errors.height.message}</Field.ErrorText>
        ) : null}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.weight)}>
        <Field.Label>Peso (kg)</Field.Label>
        <Input type="number" step="0.1" {...register('weight', { valueAsNumber: true })} />
        {errors.weight?.message ? (
          <Field.ErrorText>{errors.weight.message}</Field.ErrorText>
        ) : null}
      </Field.Root>
    </AssessmentFormLayout>
  )
}
