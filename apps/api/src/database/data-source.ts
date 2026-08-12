import 'reflect-metadata'
import 'dotenv/config'
import { DataSource } from 'typeorm'
import { User } from './entities/User'
import { UserToken } from './entities/UserToken'

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || './data/imc.sqlite',
  entities: [User, UserToken],
  migrations: ['src/database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: true,
})
