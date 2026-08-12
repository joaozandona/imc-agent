import { Router } from 'express'
import { AssessmentController } from '../controllers/assessment-controller'
import { UserPerfil } from '../database/entities/User'
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated'
import { ensureRole } from '../middlewares/ensure-role'

const assessmentRoutes = Router()
const assessmentController = new AssessmentController()

assessmentRoutes.use(ensureAuthenticated)

assessmentRoutes.get('/', assessmentController.list)
assessmentRoutes.get('/:id', assessmentController.getById)
assessmentRoutes.post(
  '/',
  ensureRole(UserPerfil.ADMIN, UserPerfil.PROFESSOR),
  assessmentController.create,
)
assessmentRoutes.put(
  '/:id',
  ensureRole(UserPerfil.ADMIN, UserPerfil.PROFESSOR),
  assessmentController.update,
)
assessmentRoutes.delete(
  '/:id',
  ensureRole(UserPerfil.ADMIN),
  assessmentController.delete,
)

export { assessmentRoutes }
