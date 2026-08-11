import { Router } from 'express'
import { LoginController } from '../controllers/login-controller'
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated'

const loginRoutes = Router()
const loginController = new LoginController()

loginRoutes.post('/', loginController.login)
loginRoutes.get('/me', ensureAuthenticated, loginController.me)

export { loginRoutes }