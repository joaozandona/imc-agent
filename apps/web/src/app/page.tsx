import { AppShell } from '@/components/app-shell'
import { ImcEvolutionPanel } from '@/components/imc-evolution-panel'
import { listAssessmentsServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import { SELECT_PAGE_SIZE } from '@/types/pagination'
import { HomePanel } from './home/home-panel'

export default async function HomePage() {
  const user = await requireSessionUser()

  if (user.role === 'aluno') {
    const assessments = await listAssessmentsServer({
      studentId: user.id,
      page: 1,
      limit: SELECT_PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    })

    return (
      <AppShell title="Painel">
        <ImcEvolutionPanel
          title="Sua evolução de IMC"
          studentName={user.name}
          assessments={assessments.data}
          subtitle="Todas as suas avaliações registradas"
        />
      </AppShell>
    )
  }

  return <HomePanel />
}
