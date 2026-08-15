import { Router } from 'express'
import { AuditLogController } from '../controllers/audit-log-controller'
import { UserPerfil } from '../database/entities/User'
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated'
import { ensureRole } from '../middlewares/ensure-role'

const auditLogRoutes = Router()
const auditLogController = new AuditLogController()

auditLogRoutes.use(ensureAuthenticated)
auditLogRoutes.use(ensureRole(UserPerfil.ADMIN))

auditLogRoutes.get('/', auditLogController.list)

export { auditLogRoutes }
