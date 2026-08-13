'use client'

import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { RoleGuard } from '@/components/role-guard'
import { CreateUserForm } from './create-user-form'

export default function NewUserPage() {
  return (
    <AuthGuard mode="protected">
      <RoleGuard allow={['admin', 'professor']}>
        <AppShell title="Usuários">
          <CreateUserForm />
        </AppShell>
      </RoleGuard>
    </AuthGuard>
  )
}
