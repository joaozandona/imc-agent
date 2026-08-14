import { AppShell } from '@/components/app-shell'
import { requireSessionUser } from '@/lib/session'
import { CreateUserForm } from './create-user-form'

export default async function NewUserPage() {
  await requireSessionUser(['admin', 'professor'])

  return (
    <AppShell title="Usuários">
      <CreateUserForm />
    </AppShell>
  )
}
