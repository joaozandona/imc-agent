import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UserPerfil, UserSituacao } from '../src/database/entities/User'
import {
  app,
  clearDatabase,
  closeTestDatabase,
  createUser,
  linkProfessorToStudent,
  setupTestDatabase,
} from './helpers/test-app'

async function loginAs(username: string, password: string) {
  const response = await request(app).post('/login').send({ username, password })
  return response.body.accessToken as string
}

describe('Assessments', () => {
  let adminToken: string
  let professorToken: string
  let studentToken: string
  let professorId: string
  let studentId: string
  let inactiveStudentId: string

  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await clearDatabase()

    await createUser({
      name: 'Admin',
      username: 'admin',
      password: 'admin123',
      role: UserPerfil.ADMIN,
    })

    const professor = await createUser({
      name: 'Professor',
      username: 'professor',
      password: '123456',
      role: UserPerfil.PROFESSOR,
    })

    const student = await createUser({
      name: 'Student',
      username: 'student',
      password: '123456',
      role: UserPerfil.ALUNO,
    })

    const inactiveStudent = await createUser({
      name: 'Inactive Student',
      username: 'inactive-student',
      password: '123456',
      role: UserPerfil.ALUNO,
      status: UserSituacao.INATIVO,
    })

    professorId = professor.id
    studentId = student.id
    inactiveStudentId = inactiveStudent.id

    await linkProfessorToStudent(professorId, studentId)
    await linkProfessorToStudent(professorId, inactiveStudentId)

    adminToken = await loginAs('admin', 'admin123')
    professorToken = await loginAs('professor', '123456')
    studentToken = await loginAs('student', '123456')
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('creates an assessment with calculated imc and classification', async () => {
    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    expect(response.status).toBe(201)
    expect(response.body.imc).toBe(22.9)
    expect(response.body.classification).toBe('Peso normal')
    expect(response.body.id).toEqual(expect.any(String))
    expect(response.body.student).toBeUndefined()
    expect(response.body.evaluator).toBeUndefined()
  })

  it('blocks professor from creating assessments for unlinked students', async () => {
    const otherStudent = await createUser({
      name: 'Other Student',
      username: 'other-student',
      password: '123456',
      role: UserPerfil.ALUNO,
    })

    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId: otherStudent.id,
        height: 1.75,
        weight: 70,
      })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('STUDENT_NOT_LINKED')
  })

  it('blocks assessments for inactive students', async () => {
    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId: inactiveStudentId,
        height: 1.7,
        weight: 70,
      })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('STUDENT_INACTIVE')
  })

  it('blocks professor from updating assessments of inactive students but allows admin', async () => {
    const created = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    expect(created.status).toBe(201)

    const deactivated = await request(app)
      .put(`/users/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inativo' })

    expect(deactivated.status).toBe(200)

    const forbidden = await request(app)
      .put(`/assessments/${created.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ weight: 80 })

    expect(forbidden.status).toBe(400)
    expect(forbidden.body.code).toBe('STUDENT_INACTIVE')

    const allowed = await request(app)
      .put(`/assessments/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weight: 80 })

    expect(allowed.status).toBe(200)
    expect(allowed.body.weight).toBe(80)
  })

  it('allows student to list only their own assessments', async () => {
    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    const response = await request(app)
      .get('/assessments')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].student.id).toBe(studentId)
    expect(response.body.data[0].student.name).toBe('Student')
    expect(response.body.data[0].evaluator.name).toBe('Professor')
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })
  })

  it('allows professor to list all assessments of linked students', async () => {
    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        height: 1.8,
        weight: 90,
      })

    const response = await request(app)
      .get('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
  })

  it('allows professor to update assessments of linked students created by others', async () => {
    const created = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        height: 1.8,
        weight: 90,
      })

    expect(created.status).toBe(201)

    const updated = await request(app)
      .put(`/assessments/${created.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        height: 1.75,
        weight: 70,
      })

    expect(updated.status).toBe(200)
    expect(updated.body.imc).toBe(22.9)
    expect(updated.body.classification).toBe('Peso normal')

    const otherStudent = await createUser({
      name: 'Other Student Update',
      username: 'other-student-update',
      password: '123456',
      role: UserPerfil.ALUNO,
    })

    const otherAssessment = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: otherStudent.id,
        height: 1.7,
        weight: 70,
      })

    const forbidden = await request(app)
      .put(`/assessments/${otherAssessment.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        weight: 80,
      })

    expect(forbidden.status).toBe(403)
  })

  it('paginates assessments list', async () => {
    for (let index = 0; index < 3; index += 1) {
      await request(app)
        .post('/assessments')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          studentId,
          height: 1.7 + index * 0.01,
          weight: 70 + index,
        })
    }

    const response = await request(app)
      .get('/assessments')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${professorToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    })
  })

  it('sorts assessments by imc on the server', async () => {
    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ studentId, height: 1.7, weight: 50 })

    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ studentId, height: 1.7, weight: 90 })

    const response = await request(app)
      .get('/assessments')
      .query({ sortBy: 'imc', sortOrder: 'asc', limit: 100 })
      .set('Authorization', `Bearer ${professorToken}`)

    expect(response.status).toBe(200)
    const imcs = response.body.data.map((item: { imc: number }) => item.imc)
    const sorted = [...imcs].sort((a, b) => a - b)
    expect(imcs).toEqual(sorted)
  })

  it('allows only admin to delete assessments', async () => {
    const created = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    const forbidden = await request(app)
      .delete(`/assessments/${created.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)

    expect(forbidden.status).toBe(403)

    const allowed = await request(app)
      .delete(`/assessments/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(allowed.status).toBe(204)
  })

  it('blocks deleting a user that has linked assessments', async () => {
    await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        height: 1.75,
        weight: 70,
      })

    const response = await request(app)
      .delete(`/users/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('USER_HAS_ASSESSMENTS')
  })
})
