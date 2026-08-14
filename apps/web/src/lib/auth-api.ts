import axios from 'axios'
import type { User } from '@/types/user'

type LoginResponse = {
  user: User
}

export async function loginRequest(username: string, password: string) {
  const { data } = await axios.post<LoginResponse>(
    '/api/auth/login',
    { username, password },
    { withCredentials: true },
  )

  return data
}

export async function logoutRequest() {
  await axios.post('/api/auth/logout', {}, { withCredentials: true })
}
