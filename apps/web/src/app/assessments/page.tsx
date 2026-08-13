'use client'

import { AppShell } from '@/components/app-shell'
import { AuthGuard } from '@/components/auth-guard'
import { AssessmentsList } from './assessments-list'

export default function AssessmentsPage() {
  return (
    <AuthGuard mode="protected">
      <AppShell title="Avaliações">
        <AssessmentsList />
      </AppShell>
    </AuthGuard>
  )
}
