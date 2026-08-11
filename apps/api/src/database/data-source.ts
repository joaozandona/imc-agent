import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || './data/imc.sqlite',
  entities: [User],
  migrations: ['src/database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: true,
})