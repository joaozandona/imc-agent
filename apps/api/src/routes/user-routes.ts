import { Router } from 'express'
import { UserController } from '../controllers/user-controller'
import { UserPerfil } from '../database/entities/User'
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated'
import { ensureRole } from '../middlewares/ensure-role'

const userRoutes = Router()
const userController = new UserController()

userRoutes.use(ensureAuthenticated)
userRoutes.use(ensureRole(UserPerfil.ADMIN, UserPerfil.PROFESSOR))

userRoutes.get('/', userController.list)
userRoutes.get('/:id', userController.getById)
userRoutes.post('/', userController.create)
userRoutes.put('/:id', userController.update)
userRoutes.delete('/:id', ensureRole(UserPerfil.ADMIN), userController.delete)

export { userRoutes }
