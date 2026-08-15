import { In } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { ProfessorStudent } from '../database/entities/ProfessorStudent'
import { User, UserPerfil } from '../database/entities/User'
import { AppError } from '../errors/app-error'

export class ProfessorStudentService {
  private links = AppDataSource.getRepository(ProfessorStudent)
  private users = AppDataSource.getRepository(User)

  async isLinked(professorId: string, studentId: string) {
    const link = await this.links.findOne({
      where: { idProfessor: professorId, idAluno: studentId },
    })
    return Boolean(link)
  }

  async listStudentIdsForProfessor(professorId: string) {
    const rows = await this.links.find({
      where: { idProfessor: professorId },
      select: { idAluno: true },
    })
    return rows.map((row) => row.idAluno)
  }

  async listProfessorIdsForStudent(studentId: string) {
    const rows = await this.links.find({
      where: { idAluno: studentId },
      select: { idProfessor: true },
    })
    return rows.map((row) => row.idProfessor)
  }

  async addLink(professorId: string, studentId: string) {
    const existing = await this.links.findOne({
      where: { idProfessor: professorId, idAluno: studentId },
    })

    if (existing) {
      return existing
    }

    const link = this.links.create({
      idProfessor: professorId,
      idAluno: studentId,
    })

    return this.links.save(link)
  }

  async removeLink(professorId: string, studentId: string) {
    await this.links.delete({ idProfessor: professorId, idAluno: studentId })
  }

  async setLinksForStudent(studentId: string, professorIds: string[]) {
    const uniqueIds = [...new Set(professorIds)]

    if (uniqueIds.length > 0) {
      const professors = await this.users.find({
        where: { id: In(uniqueIds), perfil: UserPerfil.PROFESSOR },
      })

      if (professors.length !== uniqueIds.length) {
        throw new AppError(
          'PROFESSOR_NOT_FOUND',
          404,
          'One or more professors were not found',
        )
      }
    }

    await this.links.delete({ idAluno: studentId })

    if (uniqueIds.length === 0) {
      return
    }

    const rows = uniqueIds.map((idProfessor) =>
      this.links.create({ idProfessor, idAluno: studentId }),
    )

    await this.links.save(rows)
  }

  async deleteAllForUser(userId: string) {
    await this.links.delete({ idProfessor: userId })
    await this.links.delete({ idAluno: userId })
  }
}
