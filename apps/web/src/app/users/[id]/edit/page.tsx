import { AppShell } from '@/components/app-shell'
import { getUserServer } from '@/lib/server-data'
import { requireSessionUser } from '@/lib/session'
import { EditUserForm } from './edit-user-form'

type EditUserPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requireSessionUser(['admin', 'professor'])
  const { id } = await params
  const user = await getUserServer(id)

  return (
    <AppShell title="Usuários">
      <EditUserForm user={user} />
    </AppShell>
  )
}
