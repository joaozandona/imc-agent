import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getAssessmentServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import { EditAssessmentForm } from './edit-assessment-form'

type EditAssessmentPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditAssessmentPage({
  params,
}: EditAssessmentPageProps) {
  const currentUser = await requireSessionUser(['admin', 'professor'])
  const { id } = await params

  let assessment
  try {
    assessment = await getAssessmentServer(id)
  } catch {
    notFound()
  }

  if (
    currentUser.role === 'professor' &&
    assessment.evaluator.id !== currentUser.id
  ) {
    redirect('/assessments')
  }

  return (
    <AppShell title="Avaliações">
      <EditAssessmentForm
        assessment={assessment}
        studentName={assessment.student.name}
      />
    </AppShell>
  )
}
