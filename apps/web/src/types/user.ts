export type UserRole = 'admin' | 'professor' | 'aluno'
export type UserStatus = 'ativo' | 'inativo'

export type User = {
  id: string
  name: string
  username: string
  role: UserRole
  status: UserStatus
}

export type ListUser = User & {
  createdAt: string
  updatedAt: string
  professorIds?: string[]
  professors?: { id: string; name: string }[]
  isLinked?: boolean
}
