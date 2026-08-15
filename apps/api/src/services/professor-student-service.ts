import { EntityManager, In } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { ProfessorStudent } from '../database/entities/ProfessorStudent'
import { User, UserPerfil } from '../database/entities/User'
import { AppError } from '../errors/app-error'

export class ProfessorStudentService {
  private links = AppDataSource.getRepository(ProfessorStudent)
  private users = AppDataSource.getRepository(User)

  private getLinks(manager?: EntityManager) {
    return manager ? manager.getRepository(ProfessorStudent) : this.links
  }

  private getUsers(manager?: EntityManager) {
    return manager ? manager.getRepository(User) : this.users
  }

  async isLinked(professorId: string, studentId: string, manager?: EntityManager) {
    const link = await this.getLinks(manager).findOne({
      where: { idProfessor: professorId, idAluno: studentId },
    })
    return Boolean(link)
  }

  async listStudentIdsForProfessor(professorId: string, manager?: EntityManager) {
    const rows = await this.getLinks(manager).find({
      where: { idProfessor: professorId },
      select: { idAluno: true },
    })
    return rows.map((row) => row.idAluno)
  }

  async listProfessorIdsForStudent(studentId: string, manager?: EntityManager) {
    const rows = await this.getLinks(manager).find({
      where: { idAluno: studentId },
      select: { idProfessor: true },
    })
    return rows.map((row) => row.idProfessor)
  }

  async addLink(professorId: string, studentId: string, manager?: EntityManager) {
    const links = this.getLinks(manager)
    const existing = await links.findOne({
      where: { idProfessor: professorId, idAluno: studentId },
    })

    if (existing) {
      return existing
    }

    const link = links.create({
      idProfessor: professorId,
      idAluno: studentId,
    })

    return links.save(link)
  }

  async removeLink(professorId: string, studentId: string, manager?: EntityManager) {
    await this.getLinks(manager).delete({ idProfessor: professorId, idAluno: studentId })
  }

  async setLinksForStudent(
    studentId: string,
    professorIds: string[],
    manager?: EntityManager,
  ) {
    const links = this.getLinks(manager)
    const users = this.getUsers(manager)
    const uniqueIds = [...new Set(professorIds)]

    if (uniqueIds.length > 0) {
      const professors = await users.find({
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

    await links.delete({ idAluno: studentId })

    if (uniqueIds.length === 0) {
      return
    }

    const rows = uniqueIds.map((idProfessor) =>
      links.create({ idProfessor, idAluno: studentId }),
    )

    await links.save(rows)
  }

  async deleteAllForUser(userId: string, manager?: EntityManager) {
    const links = this.getLinks(manager)
    await links.delete({ idProfessor: userId })
    await links.delete({ idAluno: userId })
  }
}
