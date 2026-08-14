import { HomePanel } from './home/home-panel'
import { requireSessionUser } from '@/lib/session'

export default async function HomePage() {
  await requireSessionUser()
  return <HomePanel />
}
