import { AppDataSource } from '../database/data-source'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import { CreateUserData, UpdateUserData } from '../schemas/user-schema'
import { CurrentUser } from '../types/current-user'
import { LoginService } from './login-service'

function toListUser(user: User) {
  return {
    id: user.id,
    name: user.nome,
    username: user.usuario,
    role: user.perfil,
    status: user.situacao,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export class UserService {
  private users = AppDataSource.getRepository(User)
  private loginService = new LoginService()

  async list(currentUser: CurrentUser) {
    if (currentUser.role === UserPerfil.ADMIN) {
      const users = await this.users.find({ order: { createdAt: 'DESC' } })
      return users.map(toListUser)
    }

    if (currentUser.role === UserPerfil.PROFESSOR) {
      const users = await this.users.find({
        where: { perfil: UserPerfil.ALUNO },
        order: { createdAt: 'DESC' },
      })
      return users.map(toListUser)
    }

    throw new AppError('FORBIDDEN', 403, 'You do not have permission to list users')
  }

  async getById(currentUser: CurrentUser, id: string) {
    const user = await this.users.findOne({ where: { id } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    this.assertCanRead(currentUser, user)
    return toListUser(user)
  }

  async create(currentUser: CurrentUser, data: CreateUserData) {
    this.assertCanCreate(currentUser, data.role as UserPerfil)

    const existing = await this.users.findOne({ where: { usuario: data.username } })

    if (existing) {
      throw new AppError('USERNAME_TAKEN', 409, 'Username is already taken')
    }

    const user = this.users.create({
      nome: data.name,
      usuario: data.username,
      senha: await this.loginService.hashPassword(data.password),
      perfil: data.role as UserPerfil,
      situacao: (data.status as UserSituacao) ?? UserSituacao.ATIVO,
    })

    await this.users.save(user)
    return toListUser(user)
  }

  async update(currentUser: CurrentUser, id: string, data: UpdateUserData) {
    const user = await this.users.findOne({ where: { id } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    this.assertCanUpdate(currentUser, user, data)

    if (data.username && data.username !== user.usuario) {
      const existing = await this.users.findOne({ where: { usuario: data.username } })
      if (existing) {
        throw new AppError('USERNAME_TAKEN', 409, 'Username is already taken')
      }
      user.usuario = data.username
    }

    if (data.name) user.nome = data.name
    if (data.role) user.perfil = data.role as UserPerfil
    if (data.status) user.situacao = data.status as UserSituacao
    if (data.password) {
      user.senha = await this.loginService.hashPassword(data.password)
    }

    await this.users.save(user)
    return toListUser(user)
  }

  async delete(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== UserPerfil.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Only admins can delete users')
    }

    const user = await this.users.findOne({ where: { id } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    const linkedAssessments = await this.countLinkedAssessments(id)

    if (linkedAssessments > 0) {
      throw new AppError(
        'USER_HAS_ASSESSMENTS',
        400,
        'Cannot delete a user with linked assessments',
      )
    }

    await this.users.remove(user)
  }

  private async countLinkedAssessments(_userId: string) {
    return 0
  }

  private assertCanRead(currentUser: CurrentUser, user: User) {
    if (currentUser.role === UserPerfil.ADMIN) return
    if (currentUser.role === UserPerfil.PROFESSOR && user.perfil === UserPerfil.ALUNO) return
    throw new AppError('FORBIDDEN', 403, 'You do not have permission to view this user')
  }

  private assertCanCreate(currentUser: CurrentUser, role: UserPerfil) {
    if (currentUser.role === UserPerfil.ADMIN) return
    if (currentUser.role === UserPerfil.PROFESSOR && role === UserPerfil.ALUNO) return
    throw new AppError('FORBIDDEN', 403, 'You do not have permission to create this user')
  }

  private assertCanUpdate(currentUser: CurrentUser, user: User, data: UpdateUserData) {
    if (currentUser.role === UserPerfil.ADMIN) return

    if (currentUser.role === UserPerfil.PROFESSOR && user.perfil === UserPerfil.ALUNO) {
      // Professors can edit students, but cannot change anyone's role
      if (data.role !== undefined) {
        throw new AppError('FORBIDDEN', 403, 'Professors cannot change user roles')
      }
      return
    }

    throw new AppError('FORBIDDEN', 403, 'You do not have permission to update this user')
  }
}
