'use client'

import { Alert, Flex, Spinner } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { EditAssessmentForm } from './edit-assessment-form'
import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { RoleGuard } from '@/components/role-guard'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { getAssessment } from '@/lib/assessments-api'

export default function EditAssessmentPage() {
  const params = useParams<{ id: string }>()
  const assessmentId = params.id

  const assessmentQuery = useQuery({
    queryKey: ['assessments', assessmentId],
    queryFn: () => getAssessment(assessmentId),
    enabled: Boolean(assessmentId),
  })

  return (
    <AuthGuard mode="protected">
      <RoleGuard allow={['admin', 'professor']}>
        <AppShell title="Avaliações">
          {assessmentQuery.isLoading ? (
            <Flex justify="center" py={16}>
              <Spinner size="lg" color="brand.solid" />
            </Flex>
          ) : null}

          {assessmentQuery.isError ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Title>
                {getApiErrorMessage(
                  assessmentQuery.error,
                  'Não foi possível carregar a avaliação.',
                )}
              </Alert.Title>
            </Alert.Root>
          ) : null}

          {assessmentQuery.data ? (
            <EditAssessmentForm
              assessment={assessmentQuery.data}
              studentName={assessmentQuery.data.student.name}
            />
          ) : null}
        </AppShell>
      </RoleGuard>
    </AuthGuard>
  )
}
