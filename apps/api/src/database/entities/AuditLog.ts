import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** May reference a deleted user — no FK on purpose */
  @Index('IDX_audit_log_actor_id')
  @Column({ name: 'actor_id', type: 'varchar' })
  actorId: string

  @Column({ name: 'actor_name', type: 'varchar', length: 60 })
  actorName: string

  @Index('IDX_audit_log_actor_username')
  @Column({ name: 'actor_username', type: 'varchar', length: 60 })
  actorUsername: string

  @Index('IDX_audit_log_action')
  @Column({ type: 'varchar', length: 80 })
  action: string

  @Index('IDX_audit_log_entity')
  @Column({ type: 'varchar', length: 40 })
  entity: string

  @Column({ name: 'entity_id', type: 'varchar' })
  entityId: string

  @Column({ type: 'text', nullable: true })
  metadata: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
