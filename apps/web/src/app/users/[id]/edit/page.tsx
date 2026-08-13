'use client'

import { Alert, Flex, Spinner } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { EditUserForm } from '@/app/users/edit-user-form'
import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { RoleGuard } from '@/components/role-guard'
import { getApiErrorMessage } from '@/lib/api-error-message'
import { getUser } from '@/lib/users-api'

export default function EditUserPage() {
  const params = useParams<{ id: string }>()
  const userId = params.id

  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId),
    enabled: Boolean(userId),
  })

  return (
    <AuthGuard mode="protected">
      <RoleGuard allow={['admin', 'professor']}>
        <AppShell title="Usuários">
          {userQuery.isLoading ? (
            <Flex justify="center" py={16}>
              <Spinner size="lg" color="brand.solid" />
            </Flex>
          ) : null}

          {userQuery.isError ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Title>
                {getApiErrorMessage(
                  userQuery.error,
                  'Não foi possível carregar o usuário.',
                )}
              </Alert.Title>
            </Alert.Root>
          ) : null}

          {userQuery.data ? <EditUserForm user={userQuery.data} /> : null}
        </AppShell>
      </RoleGuard>
    </AuthGuard>
  )
}
