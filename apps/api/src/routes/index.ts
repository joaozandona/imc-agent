import { Router } from 'express'

const routes = Router()

routes.get('/', (_req, res) => {
  res.json({
    service: 'imc-gym-api',
    status: 'ok',
  })
})

export { routes }