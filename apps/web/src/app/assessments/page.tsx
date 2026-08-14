import { AppShell } from '@/components/app-shell'
import { listAssessmentsServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/types/pagination'
import { AssessmentsList } from './assessments-list'

export default async function AssessmentsPage() {
  await requireSessionUser()

  const initialData = await listAssessmentsServer({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: DEFAULT_SORT_BY,
    sortOrder: DEFAULT_SORT_ORDER,
  })

  return (
    <AppShell title="Avaliações">
      <AssessmentsList initialData={initialData} />
    </AppShell>
  )
}
