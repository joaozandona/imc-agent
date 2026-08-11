import { Router } from 'express'
import { loginRoutes } from './login-routes'

const routes = Router()

routes.get('/', (_req, res) => {
  res.json({
    service: 'imc-gym-api',
    status: 'ok',
  })
})

routes.use('/login', loginRoutes)

export { routes }