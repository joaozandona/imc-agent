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

  it('lists only students for professor', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student Five',
        username: 'student5',
        password: '123456',
        role: 'aluno',
      })

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${professorToken}`)

    expect(response.status).toBe(200)
    expect(response.body.length).toBeGreaterThanOrEqual(1)
    expect(response.body.every((user: { role: string }) => user.role === 'aluno')).toBe(true)
  })
})
