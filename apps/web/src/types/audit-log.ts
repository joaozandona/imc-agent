export type AuditLog = {
  id: string
  actorId: string
  actorName: string
  actorUsername: string
  action: string
  entity: string
  entityId: string
  metadata: unknown
  createdAt: string
}
