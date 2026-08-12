import { UserPerfil } from '../database/entities/User'

export type CurrentUser = {
  id: string
  role: UserPerfil
}
