import 'reflect-metadata'
import 'dotenv/config'
import { calculateImc, classifyImc } from '@imc/shared'
import { AppDataSource } from '../database/data-source'
import { Assessment } from '../database/entities/Assessment'
import { User, UserPerfil, UserSituacao } from '../database/entities/User'
import { LoginService } from '../services/login-service'

const PROFESSOR_USERNAME = 'professor'
const PROFESSOR_PASSWORD = 'prof123'
const STUDENT_USERNAME = 'aluno'
const STUDENT_PASSWORD = 'aluno123'
const MONTHS = 24
const HEIGHT_METERS = 1.75
const START_WEIGHT_KG = 92
const END_WEIGHT_KG = 73.5

function assessmentDate(monthsAgo: number, now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15, 10, 0, 0, 0)

  if (date > now) {
    return new Date(now)
  }

  return date
}

function weightForMonth(indexFromOldest: number) {
  const progress = indexFromOldest / (MONTHS - 1)
  const trend = START_WEIGHT_KG + (END_WEIGHT_KG - START_WEIGHT_KG) * progress
  const wobble = Math.sin(indexFromOldest * 0.7) * 0.8
  return Math.round((trend + wobble) * 10) / 10
}

async function findOrCreateUser(
  users: ReturnType<typeof AppDataSource.getRepository<User>>,
  loginService: LoginService,
  data: {
    name: string
    username: string
    password: string
    role: UserPerfil
  },
) {
  const existing = await users.findOne({ where: { usuario: data.username } })

  if (existing) {
    return existing
  }

  const user = users.create({
    nome: data.name,
    usuario: data.username,
    senha: await loginService.hashPassword(data.password),
    perfil: data.role,
    situacao: UserSituacao.ATIVO,
  })

  return users.save(user)
}

async function seedDemoEvolution() {
  await AppDataSource.initialize()

  const users = AppDataSource.getRepository(User)
  const assessments = AppDataSource.getRepository(Assessment)
  const loginService = new LoginService()

  const professor = await findOrCreateUser(users, loginService, {
    name: 'Professor Demo',
    username: PROFESSOR_USERNAME,
    password: PROFESSOR_PASSWORD,
    role: UserPerfil.PROFESSOR,
  })

  const student = await findOrCreateUser(users, loginService, {
    name: 'Aluno Demo',
    username: STUDENT_USERNAME,
    password: STUDENT_PASSWORD,
    role: UserPerfil.ALUNO,
  })

  const previous = await assessments.find({
    where: {
      idUsuarioAluno: student.id,
      idUsuarioAvaliacao: professor.id,
    },
  })

  if (previous.length > 0) {
    await assessments.remove(previous)
  }

  const now = new Date()
  const rows = Array.from({ length: MONTHS }, (_, indexFromOldest) => {
    const monthsAgo = MONTHS - 1 - indexFromOldest
    const weight = weightForMonth(indexFromOldest)
    const imc = calculateImc(HEIGHT_METERS, weight)

    return assessments.create({
      altura: HEIGHT_METERS,
      peso: weight,
      imc,
      classificacao: classifyImc(imc),
      idUsuarioAvaliacao: professor.id,
      idUsuarioAluno: student.id,
      createdAt: assessmentDate(monthsAgo, now),
    })
  })

  await assessments.save(rows)

  const first = rows[0]
  const last = rows[rows.length - 1]

  console.log('Demo evolution seed ready')
  console.log(`  professor: ${PROFESSOR_USERNAME} / ${PROFESSOR_PASSWORD}`)
  console.log(`  aluno:     ${STUDENT_USERNAME} / ${STUDENT_PASSWORD}`)
  console.log(`  assessments: ${rows.length} (one per month, ${MONTHS / 12} years)`)
  console.log(
    `  range: ${first.createdAt.toISOString().slice(0, 10)} → ${last.createdAt.toISOString().slice(0, 10)}`,
  )
  console.log(`  IMC: ${first.imc} (${first.classificacao}) → ${last.imc} (${last.classificacao})`)

  await AppDataSource.destroy()
}

seedDemoEvolution().catch(async (error) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
