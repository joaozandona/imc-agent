import { EntityManager, FindOptionsOrder, FindOptionsWhere, In, Like } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Assessment } from '../database/entities/Assessment'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import {
  CreateUserData,
  ListUsersQuery,
  UpdateUserData,
  UserSortBy,
} from '../schemas/user-schema'
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../schemas/pagination-schema'
import { toTypeOrmOrder } from '../schemas/sort-schema'
import { CurrentUser } from '../types/current-user'
import { LoginService } from './login-service'
import { AuditService } from './audit-service'
import { ProfessorStudentService } from './professor-student-service'
import { TokenService } from './token-service'

type UserResponse = {
  id: string
  name: string
  username: string
  role: UserPerfil
  status: UserSituacao
  createdAt: Date
  updatedAt: Date
  professorIds?: string[]
  professors?: { id: string; name: string }[]
  isLinked?: boolean
}

function toListUser(user: User): UserResponse {
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

const userSortFieldMap: Record<UserSortBy, keyof User> = {
  name: 'nome',
  username: 'usuario',
  role: 'perfil',
  status: 'situacao',
  createdAt: 'createdAt',
}

export class UserService {
  private users = AppDataSource.getRepository(User)
  private assessments = AppDataSource.getRepository(Assessment)
  private loginService = new LoginService()
  private tokenService = new TokenService()
  private professorStudents = new ProfessorStudentService()
  private auditService = new AuditService()

  async list(currentUser: CurrentUser, query: ListUsersQuery) {
    const { page, limit, sortBy, sortOrder } = query
    const skip = getPaginationSkip(page, limit)
    const where = this.buildListWhere(currentUser, query)

    if (where === null) {
      throw new AppError('FORBIDDEN', 403, 'You do not have permission to list users')
    }

    const orderField = userSortFieldMap[sortBy]
    const order: FindOptionsOrder<User> = {
      [orderField]: toTypeOrmOrder(sortOrder),
    }

    const [users, total] = await this.users.findAndCount({
      where,
      order,
      skip,
      take: limit,
    })

    const linkedStudentIds =
      currentUser.role === UserPerfil.PROFESSOR
        ? new Set(await this.professorStudents.listStudentIdsForProfessor(currentUser.id))
        : null

    return {
      data: users.map((user) => {
        const item = toListUser(user)

        if (user.perfil === UserPerfil.ALUNO && linkedStudentIds) {
          item.isLinked = linkedStudentIds.has(user.id)
        }

        return item
      }),
      meta: buildPaginationMeta(page, limit, total),
    }
  }

  private buildListWhere(
    currentUser: CurrentUser,
    query: ListUsersQuery,
  ): FindOptionsWhere<User> | null {
    if (
      currentUser.role !== UserPerfil.ADMIN &&
      currentUser.role !== UserPerfil.PROFESSOR
    ) {
      return null
    }

    const where: FindOptionsWhere<User> = {}

    if (currentUser.role === UserPerfil.PROFESSOR) {
      where.perfil = UserPerfil.ALUNO
    } else if (query.role) {
      where.perfil = query.role as UserPerfil
    }

    if (query.name) {
      where.nome = Like(`%${query.name}%`)
    }

    if (query.username) {
      where.usuario = Like(`%${query.username}%`)
    }

    return where
  }

  async getById(currentUser: CurrentUser, id: string) {
    const user = await this.users.findOne({ where: { id } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    this.assertCanRead(currentUser, user)
    return this.toDetailedUser(currentUser, user)
  }

  async create(currentUser: CurrentUser, data: CreateUserData) {
    this.assertCanCreate(currentUser, data.role as UserPerfil)

    if (data.role !== UserPerfil.ALUNO && data.professorIds !== undefined) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'professorIds can only be set for students',
      )
    }

    if (currentUser.role === UserPerfil.PROFESSOR && data.professorIds !== undefined) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Professors cannot assign professor links on create',
      )
    }

    const existing = await this.users.findOne({ where: { usuario: data.username } })

    if (existing) {
      throw new AppError('USERNAME_TAKEN', 409, 'Username is already taken')
    }

    const passwordHash = await this.loginService.hashPassword(data.password)

    return AppDataSource.transaction(async (manager) => {
      const users = manager.getRepository(User)
      const user = users.create({
        nome: data.name,
        usuario: data.username,
        senha: passwordHash,
        perfil: data.role as UserPerfil,
        situacao: (data.status as UserSituacao) ?? UserSituacao.ATIVO,
      })

      await users.save(user)

      if (user.perfil === UserPerfil.ALUNO) {
        if (currentUser.role === UserPerfil.PROFESSOR) {
          await this.professorStudents.addLink(currentUser.id, user.id, manager)
          await this.auditService.record(
            {
              actorId: currentUser.id,
              action: 'professor_student.link',
              entity: 'professor_student',
              entityId: user.id,
              metadata: {
                professorId: currentUser.id,
                studentId: user.id,
              },
            },
            manager,
          )
        } else if (data.professorIds) {
          await this.professorStudents.setLinksForStudent(
            user.id,
            data.professorIds,
            manager,
          )
          await this.auditService.record(
            {
              actorId: currentUser.id,
              action: 'professor_student.set_links',
              entity: 'professor_student',
              entityId: user.id,
              metadata: {
                studentId: user.id,
                professorIds: data.professorIds,
              },
            },
            manager,
          )
        }
      }

      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'user.create',
          entity: 'user',
          entityId: user.id,
          metadata: {
            name: user.nome,
            username: user.usuario,
            role: user.perfil,
            status: user.situacao,
          },
        },
        manager,
      )

      return this.toDetailedUser(currentUser, user, manager)
    })
  }

  async update(currentUser: CurrentUser, id: string, data: UpdateUserData) {
    const user = await this.users.findOne({ where: { id } })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    }

    this.assertCanUpdate(currentUser, user, data)
    await this.assertCanUpdatePasswordOrStatus(currentUser, user, data)

    if (data.professorIds !== undefined || data.linkMyself !== undefined) {
      if (user.perfil !== UserPerfil.ALUNO && data.role !== UserPerfil.ALUNO) {
        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'Professor links can only be set for students',
        )
      }
    }

    if (data.username && data.username !== user.usuario) {
      const existing = await this.users.findOne({ where: { usuario: data.username } })
      if (existing) {
        throw new AppError('USERNAME_TAKEN', 409, 'Username is already taken')
      }
    }

    const passwordHash = data.password
      ? await this.loginService.hashPassword(data.password)
      : undefined

    return AppDataSource.transaction(async (manager) => {
      const users = manager.getRepository(User)
      const managed = await users.findOne({ where: { id } })

      if (!managed) {
        throw new AppError('USER_NOT_FOUND', 404, 'User not found')
      }

      const before = {
        name: managed.nome,
        username: managed.usuario,
        role: managed.perfil,
        status: managed.situacao,
      }

      if (data.username && data.username !== managed.usuario) {
        managed.usuario = data.username
      }

      if (data.name) managed.nome = data.name
      if (data.role) managed.perfil = data.role as UserPerfil
      if (data.status) managed.situacao = data.status as UserSituacao
      const passwordChanged = Boolean(passwordHash)
      if (passwordHash) {
        managed.senha = passwordHash
      }

      await users.save(managed)

      if (managed.situacao === UserSituacao.INATIVO) {
        await this.tokenService.revokeAllForUser(managed.id, manager)
      }

      if (managed.perfil === UserPerfil.ALUNO) {
        await this.syncStudentLinks(currentUser, managed.id, data, manager)
      } else if (data.professorIds !== undefined || data.linkMyself !== undefined) {
        await this.professorStudents.deleteAllForUser(managed.id, manager)
      }

      const after = {
        name: managed.nome,
        username: managed.usuario,
        role: managed.perfil,
        status: managed.situacao,
      }

      const changes: Record<string, unknown> = {}

      for (const key of ['name', 'username', 'role', 'status'] as const) {
        if (before[key] !== after[key]) {
          changes[key] = { from: before[key], to: after[key] }
        }
      }

      if (passwordChanged) {
        changes.passwordChanged = true
      }

      if (data.linkMyself !== undefined) {
        changes.linkMyself = data.linkMyself
      }

      if (data.professorIds !== undefined) {
        changes.professorIds = data.professorIds
      }

      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'user.update',
          entity: 'user',
          entityId: managed.id,
          metadata: { changes },
        },
        manager,
      )

      return this.toDetailedUser(currentUser, managed, manager)
    })
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

    await AppDataSource.transaction(async (manager) => {
      await this.professorStudents.deleteAllForUser(id, manager)
      await this.tokenService.revokeAllForUser(id, manager)

      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'user.delete',
          entity: 'user',
          entityId: user.id,
          metadata: {
            name: user.nome,
            username: user.usuario,
            role: user.perfil,
            status: user.situacao,
          },
        },
        manager,
      )

      await manager.getRepository(User).remove(user)
    })
  }

  private async syncStudentLinks(
    currentUser: CurrentUser,
    studentId: string,
    data: UpdateUserData,
    manager: EntityManager,
  ) {
    if (currentUser.role === UserPerfil.ADMIN && data.professorIds !== undefined) {
      await this.professorStudents.setLinksForStudent(
        studentId,
        data.professorIds,
        manager,
      )
      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'professor_student.set_links',
          entity: 'professor_student',
          entityId: studentId,
          metadata: {
            studentId,
            professorIds: data.professorIds,
          },
        },
        manager,
      )
      return
    }

    if (currentUser.role === UserPerfil.PROFESSOR && data.linkMyself !== undefined) {
      if (data.professorIds !== undefined) {
        throw new AppError(
          'FORBIDDEN',
          403,
          'Professors can only link or unlink themselves',
        )
      }

      if (data.linkMyself) {
        await this.professorStudents.addLink(currentUser.id, studentId, manager)
        await this.auditService.record(
          {
            actorId: currentUser.id,
            action: 'professor_student.link',
            entity: 'professor_student',
            entityId: studentId,
            metadata: {
              professorId: currentUser.id,
              studentId,
            },
          },
          manager,
        )
      } else {
        await this.professorStudents.removeLink(currentUser.id, studentId, manager)
        await this.auditService.record(
          {
            actorId: currentUser.id,
            action: 'professor_student.unlink',
            entity: 'professor_student',
            entityId: studentId,
            metadata: {
              professorId: currentUser.id,
              studentId,
            },
          },
          manager,
        )
      }
    }
  }

  private async toDetailedUser(
    currentUser: CurrentUser,
    user: User,
    manager?: EntityManager,
  ): Promise<UserResponse> {
    const item = toListUser(user)
    const users = manager ? manager.getRepository(User) : this.users

    if (user.perfil === UserPerfil.ALUNO) {
      const professorIds = await this.professorStudents.listProfessorIdsForStudent(
        user.id,
        manager,
      )

      if (currentUser.role === UserPerfil.ADMIN) {
        item.professorIds = professorIds

        if (professorIds.length > 0) {
          const professors = await users.find({
            where: { id: In(professorIds) },
            select: { id: true, nome: true },
          })
          const nameById = new Map(professors.map((professor) => [professor.id, professor.nome]))
          item.professors = professorIds.map((id) => ({
            id,
            name: nameById.get(id) ?? id,
          }))
        } else {
          item.professors = []
        }
      }

      if (currentUser.role === UserPerfil.PROFESSOR) {
        item.isLinked = professorIds.includes(currentUser.id)
      }
    }

    return item
  }

  private async countLinkedAssessments(userId: string) {
    return this.assessments.count({
      where: [{ idUsuarioAluno: userId }, { idUsuarioAvaliacao: userId }],
    })
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
      if (data.role !== undefined) {
        throw new AppError('FORBIDDEN', 403, 'Professors cannot change user roles')
      }
      return
    }

    throw new AppError('FORBIDDEN', 403, 'You do not have permission to update this user')
  }

  private async assertCanUpdatePasswordOrStatus(
    currentUser: CurrentUser,
    user: User,
    data: UpdateUserData,
  ) {
    if (currentUser.role !== UserPerfil.PROFESSOR) return
    if (user.perfil !== UserPerfil.ALUNO) return

    const changingPassword = Boolean(data.password)
    const changingStatus =
      data.status !== undefined && data.status !== user.situacao

    if (!changingPassword && !changingStatus) return

    const linked = await this.professorStudents.isLinked(currentUser.id, user.id)
    const linkingNow = data.linkMyself === true

    if (!linked && !linkingNow) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Professors can only change password or status of their linked students',
      )
    }
  }
}
