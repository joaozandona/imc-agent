import 'reflect-metadata'
import 'dotenv/config'
import { AppDataSource } from '../database/data-source'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { LoginService } from '../services/login-service'

async function seedAdmin() {
  await AppDataSource.initialize()

  const users = AppDataSource.getRepository(User)
  const loginService = new LoginService()
  const username = 'admin'

  const existing = await users.findOne({ where: { usuario: username } })

  if (existing) {
    console.log('Admin already exists')
    await AppDataSource.destroy()
    return
  }

  const admin = users.create({
    nome: 'Administrador',
    usuario: username,
    senha: await loginService.hashPassword('admin123'),
    perfil: UserPerfil.ADMIN,
    situacao: UserSituacao.ATIVO,
  })

  await users.save(admin)
  console.log('Admin created: username=admin password=admin123')

  await AppDataSource.destroy()
}

seedAdmin().catch(async (error) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})