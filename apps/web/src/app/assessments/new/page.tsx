'use client'

import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { RoleGuard } from '@/components/role-guard'
import { CreateAssessmentForm } from '../create-assessment-form'

export default function NewAssessmentPage() {
  return (
    <AuthGuard mode="protected">
      <RoleGuard allow={['admin', 'professor']}>
        <AppShell title="Avaliações">
          <CreateAssessmentForm />
        </AppShell>
      </RoleGuard>
    </AuthGuard>
  )
}
