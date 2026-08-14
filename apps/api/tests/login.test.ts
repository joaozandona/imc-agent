import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppDataSource } from '../src/database/data-source'
import { User, UserPerfil, UserSituacao } from '../src/database/entities/User'
import { UserToken } from '../src/database/entities/UserToken'
import { hashToken } from '../src/utils/hash-token'
import {
  app,
  clearDatabase,
  closeTestDatabase,
  createUser,
  setupTestDatabase,
} from './helpers/test-app'

describe('Login', () => {
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
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('returns access and refresh tokens for valid credentials', async () => {
    const response = await request(app).post('/login').send({
      username: 'admin',
      password: 'admin123',
    })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toEqual(expect.any(String))
    expect(response.body.refreshToken).toEqual(expect.any(String))
    expect(response.body.user).toMatchObject({
      username: 'admin',
      role: 'admin',
    })
  })

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/login').send({
      username: 'admin',
      password: 'wrong-password',
    })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects inactive users', async () => {
    await createUser({
      name: 'Inactive',
      username: 'inactive',
      password: '123456',
      role: UserPerfil.ALUNO,
      status: UserSituacao.INATIVO,
    })

    const response = await request(app).post('/login').send({
      username: 'inactive',
      password: '123456',
    })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('INACTIVE_USER')
  })

  it('stores only the hash of the refresh token in the database', async () => {
    const login = await request(app).post('/login').send({
      username: 'admin',
      password: 'admin123',
    })

    const tokens = AppDataSource.getRepository(UserToken)
    const stored = await tokens.find()

    expect(stored).toHaveLength(1)
    expect(stored[0].tokenHash).not.toBe(login.body.refreshToken)
    expect(stored[0].tokenHash).toBe(hashToken(login.body.refreshToken))
  })

  it('rejects access tokens after the user becomes inactive', async () => {
    const aluno = await createUser({
      name: 'Aluno',
      username: 'aluno1',
      password: '123456',
      role: UserPerfil.ALUNO,
    })

    const login = await request(app).post('/login').send({
      username: 'aluno1',
      password: '123456',
    })

    const users = AppDataSource.getRepository(User)
    await users.update(aluno.id, { situacao: UserSituacao.INATIVO })

    const response = await request(app)
      .get('/assessments')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('INACTIVE_USER')
  })

  it('uses the current role from the database after demotion', async () => {
    const professor = await createUser({
      name: 'Professor',
      username: 'prof1',
      password: '123456',
      role: UserPerfil.PROFESSOR,
    })

    const aluno = await createUser({
      name: 'Aluno',
      username: 'aluno1',
      password: '123456',
      role: UserPerfil.ALUNO,
    })

    const login = await request(app).post('/login').send({
      username: 'prof1',
      password: '123456',
    })

    const users = AppDataSource.getRepository(User)
    await users.update(professor.id, { perfil: UserPerfil.ALUNO })

    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        studentId: aluno.id,
        height: 1.75,
        weight: 70,
        assessmentDate: '2026-01-15',
      })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })

  it('refreshes tokens and invalidates the old refresh token', async () => {
    const login = await request(app).post('/login').send({
      username: 'admin',
      password: 'admin123',
    })

    const refresh = await request(app).post('/login/refresh').send({
      refreshToken: login.body.refreshToken,
    })

    expect(refresh.status).toBe(200)
    expect(refresh.body.accessToken).toEqual(expect.any(String))
    expect(refresh.body.refreshToken).toEqual(expect.any(String))
    expect(refresh.body.refreshToken).not.toBe(login.body.refreshToken)

    const reuseOldRefresh = await request(app).post('/login/refresh').send({
      refreshToken: login.body.refreshToken,
    })

    expect(reuseOldRefresh.status).toBe(401)
    expect(reuseOldRefresh.body.code).toBe('REFRESH_TOKEN_INVALID')
  })

  it('logs out and revokes the refresh token', async () => {
    const login = await request(app).post('/login').send({
      username: 'admin',
      password: 'admin123',
    })

    const logout = await request(app).post('/login/logout').send({
      refreshToken: login.body.refreshToken,
    })

    expect(logout.status).toBe(204)

    const refresh = await request(app).post('/login/refresh').send({
      refreshToken: login.body.refreshToken,
    })

    expect(refresh.status).toBe(401)
    expect(refresh.body.code).toBe('REFRESH_TOKEN_INVALID')
  })
})
