import { AppShell } from '@/components/app-shell'
import { listUsersServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/types/pagination'
import { UsersList } from './users-list'

export default async function UsersPage() {
  await requireSessionUser(['admin', 'professor'])

  const initialData = await listUsersServer({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: DEFAULT_SORT_BY,
    sortOrder: DEFAULT_SORT_ORDER,
  })

  return (
    <AppShell title="Usuários">
      <UsersList initialData={initialData} />
    </AppShell>
  )
}
