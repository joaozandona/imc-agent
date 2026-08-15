import 'reflect-metadata'
import 'dotenv/config'
import { join } from 'path'
import { DataSource } from 'typeorm'
import { Assessment } from './entities/Assessment'
import { AuditLog } from './entities/AuditLog'
import { ProfessorStudent } from './entities/ProfessorStudent'
import { User } from './entities/User'
import { UserToken } from './entities/UserToken'

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || './data/imc.sqlite',
  entities: [User, UserToken, Assessment, ProfessorStudent, AuditLog],
  migrations:
    process.env.NODE_ENV === 'test'
      ? []
      : [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: process.env.NODE_ENV === 'test',
  logging: process.env.NODE_ENV === 'development',
})

export default AppDataSource
