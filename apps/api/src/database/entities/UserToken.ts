import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './User'

@Entity('usuario_token')
export class UserToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'refresh_token', type: 'varchar', length: 255, unique: true })
  tokenHash: string

  @Index('IDX_usuario_token_id_usuario')
  @Column({ name: 'id_usuario', type: 'varchar' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User

  @Column({ name: 'expiracao_token', type: 'datetime' })
  expiresAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
