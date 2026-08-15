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

@Entity('avaliacao_imc')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'decimal' })
  altura: number

  @Column({ type: 'decimal' })
  peso: number

  @Column({ type: 'decimal' })
  imc: number

  @Column({ type: 'varchar', length: 30 })
  classificacao: string

  @Index('IDX_avaliacao_imc_id_usuario_avaliacao')
  @Column({ name: 'id_usuario_avaliacao', type: 'varchar' })
  idUsuarioAvaliacao: string

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario_avaliacao' })
  usuarioAvaliacao: User

  @Index('IDX_avaliacao_imc_id_usuario_aluno')
  @Column({ name: 'id_usuario_aluno', type: 'varchar' })
  idUsuarioAluno: string

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario_aluno' })
  usuarioAluno: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
