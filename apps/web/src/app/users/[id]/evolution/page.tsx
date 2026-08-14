import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ImcEvolutionPanel } from '@/components/imc-evolution-panel'
import { getUserServer, listAssessmentsServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import { SELECT_PAGE_SIZE } from '@/types/pagination'

type EvolutionPageProps = {
  params: Promise<{ id: string }>
}

export default async function StudentEvolutionPage({
  params,
}: EvolutionPageProps) {
  const currentUser = await requireSessionUser(['admin', 'professor'])
  const { id } = await params

  let student
  try {
    student = await getUserServer(id)
  } catch {
    notFound()
  }

  if (student.role !== 'aluno') {
    redirect('/users')
  }

  const assessments = await listAssessmentsServer({
    studentId: student.id,
    page: 1,
    limit: SELECT_PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  })

  const subtitle =
    currentUser.role === 'professor'
      ? 'Somente avaliações registradas por você'
      : 'Avaliações deste aluno'

  return (
    <AppShell title="Evolução">
      <ImcEvolutionPanel
        title={`Evolução de ${student.name}`}
        studentName={student.name}
        assessments={assessments.data}
        subtitle={subtitle}
        backHref="/users"
        backLabel="Voltar aos usuários"
      />
    </AppShell>
  )
}
