import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'
import { routes } from './routes'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())
app.use(routes)

export { app }
