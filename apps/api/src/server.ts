import 'reflect-metadata'
import { app } from './app'
import { AppDataSource } from './database/data-source'

async function start() {

  await AppDataSource.initialize()
  
  console.log('Database connected')
  
  const port = Number(process.env.PORT) || 3333
  
  app.listen(port, () => {
    console.log(`IMC API on http://localhost:${port}`)
  })

}
start().catch((error) => {

  console.error('Failed to start API', error)
  process.exit(1)

})