import { Router } from 'express'
import { LoginController } from '../controllers/login-controller'
import { loginRateLimit } from '../middlewares/login-rate-limit'

const loginRoutes = Router()
const loginController = new LoginController()

loginRoutes.post('/', loginRateLimit, loginController.login)
loginRoutes.post('/refresh', loginController.refresh)
loginRoutes.post('/logout', loginController.logout)

export { loginRoutes }
