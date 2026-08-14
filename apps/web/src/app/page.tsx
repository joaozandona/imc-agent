import { AppShell } from '@/components/app-shell'
import { ImcEvolutionPanel } from '@/components/imc-evolution-panel'
import { filterAssessmentsByDateRange } from '@/lib/imc-evolution'
import { listAssessmentsServer } from '@/lib/server-data'
import { firstSearchParam, requireSessionUser } from '@/lib/session'
import { SELECT_PAGE_SIZE } from '@/types/pagination'
import { HomePanel } from './home/home-panel'

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await requireSessionUser()

  if (user.role === 'aluno') {
    const params = await searchParams
    const dateRange = {
      from: firstSearchParam(params.from),
      to: firstSearchParam(params.to),
    }

    const assessments = await listAssessmentsServer({
      studentId: user.id,
      page: 1,
      limit: SELECT_PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    })

    const filtered = filterAssessmentsByDateRange(assessments.data, dateRange)

    return (
      <AppShell title="Painel">
        <ImcEvolutionPanel
          title="Sua evolução de IMC"
          studentName={user.name}
          assessments={filtered}
          filterPath="/"
          dateRange={dateRange}
          subtitle="Todas as suas avaliações registradas"
        />
      </AppShell>
    )
  }

  return <HomePanel />
}
