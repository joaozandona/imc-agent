import { calculateImc, classifyImc } from '@imc/shared'
import { FindOptionsOrder, FindOptionsWhere, In } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Assessment } from '../database/entities/Assessment'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import {
  AssessmentSortBy,
  CreateAssessmentData,
  ListAssessmentsQuery,
  UpdateAssessmentData,
} from '../schemas/assessment-schema'
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../schemas/pagination-schema'
import { SortOrder, toTypeOrmOrder } from '../schemas/sort-schema'
import { CurrentUser } from '../types/current-user'
import { ProfessorStudentService } from './professor-student-service'
import { AuditService } from './audit-service'

const assessmentRelations = {
  usuarioAluno: true,
  usuarioAvaliacao: true,
} as const

function toRelatedUser(user: User) {
  return {
    id: user.id,
    name: user.nome,
  }
}

function toListAssessment(assessment: Assessment) {
  return {
    id: assessment.id,
    height: Number(assessment.altura),
    weight: Number(assessment.peso),
    imc: Number(assessment.imc),
    classification: assessment.classificacao,
    student: toRelatedUser(assessment.usuarioAluno),
    evaluator: toRelatedUser(assessment.usuarioAvaliacao),
    createdAt: assessment.createdAt,
  }
}

function toSavedAssessment(assessment: Assessment) {
  return {
    id: assessment.id,
    height: Number(assessment.altura),
    weight: Number(assessment.peso),
    imc: Number(assessment.imc),
    classification: assessment.classificacao,
    createdAt: assessment.createdAt,
  }
}

function buildAssessmentOrder(
  sortBy: AssessmentSortBy,
  sortOrder: SortOrder,
): FindOptionsOrder<Assessment> {
  const direction = toTypeOrmOrder(sortOrder)

  if (sortBy === 'student') {
    return { usuarioAluno: { nome: direction } }
  }

  if (sortBy === 'evaluator') {
    return { usuarioAvaliacao: { nome: direction } }
  }

  const fieldMap: Record<
    Exclude<AssessmentSortBy, 'student' | 'evaluator'>,
    keyof Assessment
  > = {
    createdAt: 'createdAt',
    height: 'altura',
    weight: 'peso',
    imc: 'imc',
    classification: 'classificacao',
  }

  return { [fieldMap[sortBy]]: direction }
}

export class AssessmentService {
  private assessments = AppDataSource.getRepository(Assessment)
  private users = AppDataSource.getRepository(User)
  private professorStudents = new ProfessorStudentService()
  private auditService = new AuditService()

  private async findOneWithRelations(id: string) {
    return this.assessments.findOne({
      where: { id },
      relations: assessmentRelations,
    })
  }

  async list(currentUser: CurrentUser, query: ListAssessmentsQuery) {
    const { page, limit, sortBy, sortOrder } = query
    const skip = getPaginationSkip(page, limit)
    const where: FindOptionsWhere<Assessment> = {}

    if (currentUser.role === UserPerfil.ALUNO) {
      where.idUsuarioAluno = currentUser.id
    }

    let linkedStudentIds: string[] | null = null

    if (currentUser.role === UserPerfil.PROFESSOR) {
      linkedStudentIds = await this.professorStudents.listStudentIdsForProfessor(
        currentUser.id,
      )

      if (linkedStudentIds.length === 0) {
        return {
          data: [],
          meta: buildPaginationMeta(page, limit, 0),
        }
      }

      where.idUsuarioAluno = In(linkedStudentIds)
    }

    if (query.studentId) {
      if (currentUser.role === UserPerfil.ALUNO && query.studentId !== currentUser.id) {
        throw new AppError('FORBIDDEN', 403, 'Students can only view their own assessments')
      }

      if (currentUser.role === UserPerfil.PROFESSOR) {
        const linked = await this.professorStudents.isLinked(
          currentUser.id,
          query.studentId,
        )

        if (!linked) {
          throw new AppError(
            'STUDENT_NOT_LINKED',
            403,
            'You can only view assessments of your linked students',
          )
        }
      }

      where.idUsuarioAluno = query.studentId
    }

    if (query.idUsuarioAvaliacao) {
      if (currentUser.role === UserPerfil.ALUNO) {
        throw new AppError('FORBIDDEN', 403, 'Students cannot filter by evaluator')
      }

      where.idUsuarioAvaliacao = query.idUsuarioAvaliacao
    }

    const [assessments, total] = await this.assessments.findAndCount({
      where,
      relations: assessmentRelations,
      order: buildAssessmentOrder(sortBy, sortOrder),
      skip,
      take: limit,
    })

    return {
      data: assessments.map(toListAssessment),
      meta: buildPaginationMeta(page, limit, total),
    }
  }

  async getById(currentUser: CurrentUser, id: string) {
    const assessment = await this.findOneWithRelations(id)

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    await this.assertCanRead(currentUser, assessment)
    return toListAssessment(assessment)
  }

  async create(currentUser: CurrentUser, data: CreateAssessmentData) {
    if (
      currentUser.role !== UserPerfil.ADMIN &&
      currentUser.role !== UserPerfil.PROFESSOR
    ) {
      throw new AppError('FORBIDDEN', 403, 'Only admins and professors can create assessments')
    }

    const student = await this.users.findOne({ where: { id: data.studentId } })

    if (!student || student.perfil !== UserPerfil.ALUNO) {
      throw new AppError('STUDENT_NOT_FOUND', 404, 'Student not found')
    }

    if (student.situacao === UserSituacao.INATIVO) {
      throw new AppError(
        'STUDENT_INACTIVE',
        400,
        'Cannot create assessments for inactive students',
      )
    }

    if (currentUser.role === UserPerfil.PROFESSOR) {
      const linked = await this.professorStudents.isLinked(currentUser.id, student.id)

      if (!linked) {
        throw new AppError(
          'STUDENT_NOT_LINKED',
          403,
          'You can only create assessments for your linked students',
        )
      }
    }

    const imc = calculateImc(data.height, data.weight)
    const classification = classifyImc(imc)

    return AppDataSource.transaction(async (manager) => {
      const assessments = manager.getRepository(Assessment)
      const assessment = assessments.create({
        altura: data.height,
        peso: data.weight,
        imc,
        classificacao: classification,
        idUsuarioAvaliacao: currentUser.id,
        idUsuarioAluno: student.id,
      })

      await assessments.save(assessment)

      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'assessment.create',
          entity: 'assessment',
          entityId: assessment.id,
          metadata: {
            studentId: student.id,
            height: data.height,
            weight: data.weight,
            imc,
            classification,
          },
        },
        manager,
      )

      return toSavedAssessment(assessment)
    })
  }

  async update(currentUser: CurrentUser, id: string, data: UpdateAssessmentData) {
    const assessment = await this.assessments.findOne({ where: { id } })

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    await this.assertCanWrite(currentUser, assessment)

    if (currentUser.role !== UserPerfil.ADMIN) {
      const student = await this.users.findOne({
        where: { id: assessment.idUsuarioAluno },
      })

      if (!student) {
        throw new AppError('STUDENT_NOT_FOUND', 404, 'Student not found')
      }

      if (student.situacao === UserSituacao.INATIVO) {
        throw new AppError(
          'STUDENT_INACTIVE',
          400,
          'Cannot update assessments for inactive students',
        )
      }
    }

    const height = data.height ?? Number(assessment.altura)
    const weight = data.weight ?? Number(assessment.peso)
    const imc = calculateImc(height, weight)
    const classification = classifyImc(imc)

    return AppDataSource.transaction(async (manager) => {
      const assessments = manager.getRepository(Assessment)
      const managed = await assessments.findOne({ where: { id } })

      if (!managed) {
        throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
      }

      managed.altura = height
      managed.peso = weight
      managed.imc = imc
      managed.classificacao = classification

      await assessments.save(managed)

      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'assessment.update',
          entity: 'assessment',
          entityId: managed.id,
          metadata: {
            studentId: managed.idUsuarioAluno,
            height,
            weight,
            imc,
            classification: managed.classificacao,
          },
        },
        manager,
      )

      return toSavedAssessment(managed)
    })
  }

  async delete(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== UserPerfil.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Only admins can delete assessments')
    }

    const assessment = await this.assessments.findOne({ where: { id } })

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    await AppDataSource.transaction(async (manager) => {
      await this.auditService.record(
        {
          actorId: currentUser.id,
          action: 'assessment.delete',
          entity: 'assessment',
          entityId: assessment.id,
          metadata: {
            studentId: assessment.idUsuarioAluno,
            evaluatorId: assessment.idUsuarioAvaliacao,
            height: Number(assessment.altura),
            weight: Number(assessment.peso),
            imc: Number(assessment.imc),
            classification: assessment.classificacao,
          },
        },
        manager,
      )

      await manager.getRepository(Assessment).remove(assessment)
    })
  }

  private async assertCanRead(currentUser: CurrentUser, assessment: Assessment) {
    if (currentUser.role === UserPerfil.ADMIN) return

    if (currentUser.role === UserPerfil.PROFESSOR) {
      const linked = await this.professorStudents.isLinked(
        currentUser.id,
        assessment.idUsuarioAluno,
      )

      if (linked) return
    }

    if (
      currentUser.role === UserPerfil.ALUNO &&
      assessment.idUsuarioAluno === currentUser.id
    ) {
      return
    }

    throw new AppError('FORBIDDEN', 403, 'You do not have permission to view this assessment')
  }

  private async assertCanWrite(currentUser: CurrentUser, assessment: Assessment) {
    if (currentUser.role === UserPerfil.ADMIN) return

    if (currentUser.role === UserPerfil.PROFESSOR) {
      const linked = await this.professorStudents.isLinked(
        currentUser.id,
        assessment.idUsuarioAluno,
      )

      if (linked) return
    }

    throw new AppError(
      'FORBIDDEN',
      403,
      'You do not have permission to update this assessment',
    )
  }
}
