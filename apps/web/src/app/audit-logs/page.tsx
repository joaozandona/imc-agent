import { AppShell } from '@/components/app-shell'
import { listAuditLogsServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import { DEFAULT_PAGE_SIZE } from '@/types/pagination'
import { AuditLogsList } from './audit-logs-list'

export default async function AuditLogsPage() {
  await requireSessionUser(['admin'])

  const initialData = await listAuditLogsServer({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
  })

  return (
    <AppShell title="Auditoria">
      <AuditLogsList initialData={initialData} />
    </AppShell>
  )
}
