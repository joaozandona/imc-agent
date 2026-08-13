import { calculateImc, classifyImc } from '@imc/shared'
import { FindOptionsWhere } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Assessment } from '../database/entities/Assessment'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import {
  CreateAssessmentData,
  ListAssessmentsQuery,
  UpdateAssessmentData,
} from '../schemas/assessment-schema'
import { CurrentUser } from '../types/current-user'

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

export class AssessmentService {
  private assessments = AppDataSource.getRepository(Assessment)
  private users = AppDataSource.getRepository(User)

  private async findOneWithRelations(id: string) {
    return this.assessments.findOne({
      where: { id },
      relations: assessmentRelations,
    })
  }

  async list(currentUser: CurrentUser, query: ListAssessmentsQuery) {
    const where: FindOptionsWhere<Assessment> = {}

    if (currentUser.role === UserPerfil.ALUNO) {
      where.idUsuarioAluno = currentUser.id
    }

    if (currentUser.role === UserPerfil.PROFESSOR) {
      where.idUsuarioAvaliacao = currentUser.id
    }

    if (query.studentId) {
      if (currentUser.role === UserPerfil.ALUNO && query.studentId !== currentUser.id) {
        throw new AppError('FORBIDDEN', 403, 'Students can only view their own assessments')
      }
      where.idUsuarioAluno = query.studentId
    }

    if (query.idUsuarioAvaliacao) {
      if (
        currentUser.role === UserPerfil.PROFESSOR &&
        query.idUsuarioAvaliacao !== currentUser.id
      ) {
        throw new AppError(
          'FORBIDDEN',
          403,
          'Professors can only view assessments they registered',
        )
      }

      if (currentUser.role === UserPerfil.ALUNO) {
        throw new AppError('FORBIDDEN', 403, 'Students cannot filter by evaluator')
      }

      where.idUsuarioAvaliacao = query.idUsuarioAvaliacao
    }

    const assessments = await this.assessments.find({
      where,
      relations: assessmentRelations,
      order: { createdAt: 'DESC' },
    })

    return assessments.map(toListAssessment)
  }

  async getById(currentUser: CurrentUser, id: string) {
    const assessment = await this.findOneWithRelations(id)

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    this.assertCanRead(currentUser, assessment)
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

    const imc = calculateImc(data.height, data.weight)
    const classification = classifyImc(imc)

    const assessment = this.assessments.create({
      altura: data.height,
      peso: data.weight,
      imc,
      classificacao: classification,
      idUsuarioAvaliacao: currentUser.id,
      idUsuarioAluno: student.id,
    })

    await this.assessments.save(assessment)
    return toSavedAssessment(assessment)
  }

  async update(currentUser: CurrentUser, id: string, data: UpdateAssessmentData) {
    const assessment = await this.assessments.findOne({ where: { id } })

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    this.assertCanWrite(currentUser, assessment)

    const height = data.height ?? Number(assessment.altura)
    const weight = data.weight ?? Number(assessment.peso)
    const imc = calculateImc(height, weight)

    assessment.altura = height
    assessment.peso = weight
    assessment.imc = imc
    assessment.classificacao = classifyImc(imc)

    await this.assessments.save(assessment)
    return toSavedAssessment(assessment)
  }

  async delete(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== UserPerfil.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Only admins can delete assessments')
    }

    const assessment = await this.assessments.findOne({ where: { id } })

    if (!assessment) {
      throw new AppError('ASSESSMENT_NOT_FOUND', 404, 'Assessment not found')
    }

    await this.assessments.remove(assessment)
  }

  private assertCanRead(currentUser: CurrentUser, assessment: Assessment) {
    if (currentUser.role === UserPerfil.ADMIN) return

    if (
      currentUser.role === UserPerfil.PROFESSOR &&
      assessment.idUsuarioAvaliacao === currentUser.id
    ) {
      return
    }

    if (
      currentUser.role === UserPerfil.ALUNO &&
      assessment.idUsuarioAluno === currentUser.id
    ) {
      return
    }

    throw new AppError('FORBIDDEN', 403, 'You do not have permission to view this assessment')
  }

  private assertCanWrite(currentUser: CurrentUser, assessment: Assessment) {
    if (currentUser.role === UserPerfil.ADMIN) return

    if (
      currentUser.role === UserPerfil.PROFESSOR &&
      assessment.idUsuarioAvaliacao === currentUser.id
    ) {
      return
    }

    throw new AppError(
      'FORBIDDEN',
      403,
      'You do not have permission to update this assessment',
    )
  }
}
