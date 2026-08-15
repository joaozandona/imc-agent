import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UserPerfil } from '../src/database/entities/User'
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

describe('Users', () => {
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
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('allows admin to create any role', async () => {
    const token = await loginAs('admin', 'admin123')

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Student',
        username: 'student1',
        password: '123456',
        role: 'aluno',
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      username: 'student1',
      role: 'aluno',
    })
    expect(response.body.senha).toBeUndefined()
    expect(response.body.password).toBeUndefined()
  })

  it('allows professor to create students only', async () => {
    const token = await loginAs('professor', '123456')

    const createStudent = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Student Two',
        username: 'student2',
        password: '123456',
        role: 'aluno',
      })

    expect(createStudent.status).toBe(201)

    const createAdmin = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Fake Admin',
        username: 'fakeadmin',
        password: '123456',
        role: 'admin',
      })

    expect(createAdmin.status).toBe(403)
    expect(createAdmin.body.code).toBe('FORBIDDEN')
  })

  it('prevents professor from changing roles', async () => {
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Student Three',
        username: 'student3',
        password: '123456',
        role: 'aluno',
      })

    const response = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        role: 'professor',
      })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })

  it('allows only admin to delete users', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student Four',
        username: 'student4',
        password: '123456',
        role: 'aluno',
      })

    const forbiddenDelete = await request(app)
      .delete(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)

    expect(forbiddenDelete.status).toBe(403)

    const allowedDelete = await request(app)
      .delete(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(allowedDelete.status).toBe(204)
  })

  it('lists only students for professor with isLinked flag', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const created = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student Five',
        username: 'student5',
        password: '123456',
        role: 'aluno',
      })

    const linked = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Student Linked',
        username: 'studentlinked',
        password: '123456',
        role: 'aluno',
      })

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${professorToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data.length).toBeGreaterThanOrEqual(2)
    expect(
      response.body.data.every((user: { role: string }) => user.role === 'aluno'),
    ).toBe(true)

    const unlinkedRow = response.body.data.find(
      (user: { id: string }) => user.id === created.body.id,
    )
    const linkedRow = response.body.data.find(
      (user: { id: string }) => user.id === linked.body.id,
    )

    expect(unlinkedRow.isLinked).toBe(false)
    expect(linkedRow.isLinked).toBe(true)
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 20,
    })
  })

  it('auto-links student when professor creates them', async () => {
    const professorToken = await loginAs('professor', '123456')

    const created = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Auto Linked',
        username: 'autolinked',
        password: '123456',
        role: 'aluno',
      })

    expect(created.status).toBe(201)
    expect(created.body.isLinked).toBe(true)
    expect(created.body.professorIds).toBeUndefined()
    expect(created.body.professors).toBeUndefined()
  })

  it('allows professor to link themselves on student edit', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'To Link',
        username: 'tolink',
        password: '123456',
        role: 'aluno',
      })

    const before = await request(app)
      .get(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)

    expect(before.body.isLinked).toBe(false)

    const linked = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ linkMyself: true })

    expect(linked.status).toBe(200)
    expect(linked.body.isLinked).toBe(true)

    const assessment = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        studentId: student.body.id,
        height: 1.75,
        weight: 70,
      })

    expect(assessment.status).toBe(201)

    const unlinked = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ linkMyself: false })

    expect(unlinked.status).toBe(200)
    expect(unlinked.body.isLinked).toBe(false)
  })

  it('allows admin to set professorIds on students', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    const professors = await request(app)
      .get('/users')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`)

    const professor = professors.body.data.find(
      (user: { role: string; username: string }) =>
        user.role === 'professor' && user.username === 'professor',
    )

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Linked',
        username: 'adminlinked',
        password: '123456',
        role: 'aluno',
        professorIds: [professor.id],
      })

    expect(student.status).toBe(201)
    expect(student.body.professorIds).toEqual([professor.id])
  })

  it('prevents professor from changing password or status of unlinked students', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unlinked Student',
        username: 'unlinkedstudent',
        password: '123456',
        role: 'aluno',
      })

    const passwordAttempt = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        password: '654321',
      })

    expect(passwordAttempt.status).toBe(403)
    expect(passwordAttempt.body.code).toBe('FORBIDDEN')

    const statusAttempt = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        status: 'inativo',
      })

    expect(statusAttempt.status).toBe(403)
    expect(statusAttempt.body.code).toBe('FORBIDDEN')

    const nameUpdate = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Renamed Unlinked',
      })

    expect(nameUpdate.status).toBe(200)
    expect(nameUpdate.body.name).toBe('Renamed Unlinked')
  })

  it('allows professor to change password after linking in the same request', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Link And Password',
        username: 'linkandpassword',
        password: '123456',
        role: 'aluno',
      })

    const response = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        linkMyself: true,
        password: '654321',
        status: 'inativo',
      })

    expect(response.status).toBe(200)
    expect(response.body.isLinked).toBe(true)
    expect(response.body.status).toBe('inativo')
  })

  it('paginates users list for admin', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    for (let index = 0; index < 3; index += 1) {
      await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Student ${index}`,
          username: `student-page-${index}`,
          password: '123456',
          role: 'aluno',
        })
    }

    const response = await request(app)
      .get('/users')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.meta.page).toBe(1)
    expect(response.body.meta.limit).toBe(2)
    expect(response.body.meta.total).toBeGreaterThanOrEqual(3)
    expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('filters users by name and username', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ana Filter',
        username: 'anafilter',
        password: '123456',
        role: 'aluno',
      })

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bruno Other',
        username: 'bruno',
        password: '123456',
        role: 'aluno',
      })

    const byName = await request(app)
      .get('/users')
      .query({ name: 'Ana' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(byName.status).toBe(200)
    expect(byName.body.data).toHaveLength(1)
    expect(byName.body.data[0].name).toBe('Ana Filter')

    const byUsername = await request(app)
      .get('/users')
      .query({ username: 'bruno' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(byUsername.status).toBe(200)
    expect(byUsername.body.data).toHaveLength(1)
    expect(byUsername.body.data[0].username).toBe('bruno')
  })

  it('sorts users by name across the full dataset', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Zack',
        username: 'zack',
        password: '123456',
        role: 'aluno',
      })

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Abel',
        username: 'abel',
        password: '123456',
        role: 'aluno',
      })

    const response = await request(app)
      .get('/users')
      .query({ sortBy: 'name', sortOrder: 'asc', limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    const names = response.body.data.map((user: { name: string }) => user.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })
})
