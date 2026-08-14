import { AppShell } from '@/components/app-shell'
import { requireSessionUser } from '@/lib/session'
import { CreateAssessmentForm } from './create-assessment-form'

export default async function NewAssessmentPage() {
  await requireSessionUser(['admin', 'professor'])

  return (
    <AppShell title="Avaliações">
      <CreateAssessmentForm />
    </AppShell>
  )
}
