import { FindOptionsWhere, Like } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { AuditLog } from '../database/entities/AuditLog'
import { User, UserPerfil } from '../database/entities/User'
import { AppError } from '../errors/app-error'
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../schemas/pagination-schema'
import { ListAuditLogsQuery } from '../schemas/audit-log-schema'
import { CurrentUser } from '../types/current-user'

const SENSITIVE_KEYS = new Set([
  'password',
  'senha',
  'token',
  'refreshtoken',
  'accesstoken',
  'tokenhash',
  'secret',
  'authorization',
  'cookie',
  'cookies',
])

const ALLOWED_KEYS = new Set(['passwordchanged'])

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase()

  if (ALLOWED_KEYS.has(normalized)) {
    return false
  }

  if (SENSITIVE_KEYS.has(normalized)) {
    return true
  }

  return /password|senha|token|secret|authorization|cookie/i.test(normalized)
}

export type AuditRecordInput = {
  actorId: string
  action: string
  entity: string
  entityId: string
  metadata?: Record<string, unknown>
}

function sanitizeMetadata(
  value: unknown,
): Record<string, unknown> | unknown[] | string | number | boolean | null {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item))
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {}

    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        continue
      }
      output[key] = sanitizeMetadata(nested)
    }

    return output
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  return String(value)
}

export class AuditService {
  private logs = AppDataSource.getRepository(AuditLog)
  private users = AppDataSource.getRepository(User)

  async record(input: AuditRecordInput) {
    const actor = await this.users.findOne({ where: { id: input.actorId } })

    const metadata = input.metadata
      ? JSON.stringify(sanitizeMetadata(input.metadata))
      : null

    const row = this.logs.create({
      actorId: input.actorId,
      actorName: actor?.nome ?? 'unknown',
      actorUsername: actor?.usuario ?? 'unknown',
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata,
    })

    await this.logs.save(row)
  }

  async list(currentUser: CurrentUser, query: ListAuditLogsQuery) {
    if (currentUser.role !== UserPerfil.ADMIN) {
      throw new AppError('FORBIDDEN', 403, 'Only admins can view audit logs')
    }

    const { page, limit, action, entity, actorUsername } = query
    const where: FindOptionsWhere<AuditLog> = {}

    if (action) {
      where.action = action
    }

    if (entity) {
      where.entity = entity
    }

    if (actorUsername) {
      where.actorUsername = Like(`%${actorUsername}%`)
    }

    const [rows, total] = await this.logs.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: getPaginationSkip(page, limit),
      take: limit,
    })

    return {
      data: rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        actorName: row.actorName,
        actorUsername: row.actorUsername,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        metadata: row.metadata ? (JSON.parse(row.metadata) as unknown) : null,
        createdAt: row.createdAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    }
  }
}
