import { AppDataSource } from '../../src/database/data-source'
import { Assessment } from '../../src/database/entities/Assessment'
import { User, UserPerfil, UserSituacao } from '../../src/database/entities/User'
import { UserToken } from '../../src/database/entities/UserToken'
import { LoginService } from '../../src/services/login-service'
import { app } from '../../src/app'

const loginService = new LoginService()

export async function setupTestDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
}

export async function closeTestDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
}

export async function clearDatabase() {
  const assessments = AppDataSource.getRepository(Assessment)
  const tokens = AppDataSource.getRepository(UserToken)
  const users = AppDataSource.getRepository(User)

  await assessments.clear()
  await tokens.clear()
  await users.clear()
}

export async function createUser(params: {
  name: string
  username: string
  password: string
  role: UserPerfil
  status?: UserSituacao
}) {
  const users = AppDataSource.getRepository(User)

  const user = users.create({
    nome: params.name,
    usuario: params.username,
    senha: await loginService.hashPassword(params.password),
    perfil: params.role,
    situacao: params.status ?? UserSituacao.ATIVO,
  })

  return users.save(user)
}

export { app }
