import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UserPerfil, UserSituacao } from '../src/database/entities/User'
import {
  app,
  clearDatabase,
  closeTestDatabase,
  createUser,
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

    await createUser({
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

    studentId = student.id
    inactiveStudentId = inactiveStudent.id
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
    expect(response.body.idUsuarioAluno).toBe(studentId)
    expect(response.body.idUsuarioAvaliacao).toEqual(expect.any(String))
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
    expect(response.body).toHaveLength(1)
    expect(response.body[0].idUsuarioAluno).toBe(studentId)
  })

  it('allows professor to list only assessments they registered', async () => {
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
    expect(response.body).toHaveLength(1)
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
