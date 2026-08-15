import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ImcEvolutionPanel } from '@/components/imc-evolution-panel'
import { filterAssessmentsByDateRange } from '@/lib/imc-evolution'
import { getUserServer, listAssessmentsServer } from '@/lib/server-data'
import { firstSearchParam, requireSessionUser } from '@/lib/session'
import { SELECT_PAGE_SIZE } from '@/types/pagination'

type EvolutionPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function StudentEvolutionPage({
  params,
  searchParams,
}: EvolutionPageProps) {
  const currentUser = await requireSessionUser(['admin', 'professor'])
  const { id } = await params
  const query = await searchParams
  const dateRange = {
    from: firstSearchParam(query.from),
    to: firstSearchParam(query.to),
  }

  let student
  try {
    student = await getUserServer(id)
  } catch {
    notFound()
  }

  if (student.role !== 'aluno') {
    redirect('/users')
  }

  if (currentUser.role === 'professor' && !student.isLinked) {
    redirect('/users')
  }

  const assessments = await listAssessmentsServer({
    studentId: student.id,
    page: 1,
    limit: SELECT_PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  })

  const filtered = filterAssessmentsByDateRange(assessments.data, dateRange)

  return (
    <AppShell title="Evolução">
      <ImcEvolutionPanel
        title={`Evolução de ${student.name}`}
        studentName={student.name}
        assessments={filtered}
        filterPath={`/users/${student.id}/evolution`}
        dateRange={dateRange}
        subtitle={'Avaliações do aluno'}
        backHref="/users"
        backLabel="Voltar aos usuários"
      />
    </AppShell>
  )
}
