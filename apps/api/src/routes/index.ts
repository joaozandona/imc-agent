import { Router } from 'express'
import { assessmentRoutes } from './assessment-routes'
import { loginRoutes } from './login-routes'
import { userRoutes } from './user-routes'

const routes = Router()

routes.get('/', (_req, res) => {
  res.json({
    service: 'imc-gym-api',
    status: 'ok',
  })
})

routes.use('/login', loginRoutes)
routes.use('/users', userRoutes)
routes.use('/assessments', assessmentRoutes)

export { routes }
