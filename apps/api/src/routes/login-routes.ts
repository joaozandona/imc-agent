import { Router } from 'express'
import { LoginController } from '../controllers/login-controller'

const loginRoutes = Router()
const loginController = new LoginController()

loginRoutes.post('/', loginController.login)
loginRoutes.post('/refresh', loginController.refresh)
loginRoutes.post('/logout', loginController.logout)

export { loginRoutes }
