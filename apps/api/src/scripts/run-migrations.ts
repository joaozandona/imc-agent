import 'reflect-metadata'
import 'dotenv/config'
import { AppDataSource } from '../database/data-source'

async function runMigrations() {
  await AppDataSource.initialize()

  const executed = await AppDataSource.runMigrations()
  console.log(
    executed.length > 0
      ? `Applied ${executed.length} migration(s)`
      : 'No pending migrations',
  )

  await AppDataSource.destroy()
}

runMigrations().catch(async (error) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
