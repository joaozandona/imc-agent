import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { User } from './User'

@Entity('professor_aluno')
@Unique('UQ_professor_aluno', ['idProfessor', 'idAluno'])
export class ProfessorStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'id_professor', type: 'varchar' })
  idProfessor: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'id_professor' })
  professor: User

  @Column({ name: 'id_aluno', type: 'varchar' })
  idAluno: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'id_aluno' })
  aluno: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
