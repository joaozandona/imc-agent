'use client'

import { AuthGuard } from '@/components/auth-guard'
import { AppShell } from '@/components/app-shell'
import { RoleGuard } from '@/components/role-guard'
import { UsersList } from './users-list'

export default function UsersPage() {
  return (
    <AuthGuard mode="protected">
      <RoleGuard allow={['admin', 'professor']}>
        <AppShell title="Usuários">
          <UsersList />
        </AppShell>
      </RoleGuard>
    </AuthGuard>
  )
}
