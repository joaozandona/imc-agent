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

describe('Audit logs', () => {
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

  it('records user actions and allows only admin to list them', async () => {
    const adminToken = await loginAs('admin', 'admin123')
    const professorToken = await loginAs('professor', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student Audit',
        username: 'studentaudit',
        password: '123456',
        role: 'aluno',
      })

    expect(student.status).toBe(201)

    const forbidden = await request(app)
      .get('/audit-logs')
      .set('Authorization', `Bearer ${professorToken}`)

    expect(forbidden.status).toBe(403)

    const logs = await request(app)
      .get('/audit-logs')
      .query({ action: 'user.create' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(logs.status).toBe(200)
    expect(logs.body.data.length).toBeGreaterThanOrEqual(1)
    expect(logs.body.data[0]).toMatchObject({
      action: 'user.create',
      entity: 'user',
      entityId: student.body.id,
      actorUsername: 'admin',
    })
    expect(JSON.stringify(logs.body.data[0].metadata)).not.toMatch(
      /"(password|senha|token)"\s*:/i,
    )
  })

  it('stores update diffs including passwordChanged', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Before Name',
        username: 'diffuser',
        password: '123456',
        role: 'aluno',
      })

    const updated = await request(app)
      .put(`/users/${student.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'After Name',
        password: '654321',
      })

    expect(updated.status).toBe(200)

    const logs = await request(app)
      .get('/audit-logs')
      .query({ action: 'user.update', entity: 'user' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(logs.status).toBe(200)
    const log = logs.body.data.find(
      (item: { entityId: string }) => item.entityId === student.body.id,
    )

    expect(log.metadata).toMatchObject({
      changes: {
        name: { from: 'Before Name', to: 'After Name' },
        passwordChanged: true,
      },
    })
    expect(log.metadata.changes).not.toHaveProperty('password')
    expect(log.metadata.changes).not.toHaveProperty('senha')
  })

  it('keeps audit logs after the actor user is deleted', async () => {
    const adminToken = await loginAs('admin', 'admin123')

    const professor = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Temp Professor',
        username: 'tempprof',
        password: '123456',
        role: 'professor',
      })

    const professorToken = await loginAs('tempprof', '123456')

    const student = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        name: 'Linked By Temp',
        username: 'linkedbytemp',
        password: '123456',
        role: 'aluno',
      })

    expect(student.status).toBe(201)

    const deleted = await request(app)
      .delete(`/users/${professor.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(deleted.status).toBe(204)

    const logs = await request(app)
      .get('/audit-logs')
      .query({ actorUsername: 'tempprof', action: 'user.create' })
      .set('Authorization', `Bearer ${adminToken}`)

    expect(logs.status).toBe(200)
    expect(logs.body.data.length).toBeGreaterThanOrEqual(1)
    expect(logs.body.data[0].actorUsername).toBe('tempprof')
    expect(logs.body.data[0].actorId).toBe(professor.body.id)
  })
})
