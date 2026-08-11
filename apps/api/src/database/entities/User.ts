import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum UserPerfil {
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  ALUNO = 'aluno',
}

export enum UserSituacao {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
}

@Entity('usuario')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 60 })
  nome: string

  @Column({ type: 'varchar', length: 60, unique: true })
  usuario: string

  @Column({ type: 'varchar', length: 255 })
  senha: string

  @Column({ type: 'varchar', length: 20 })
  perfil: UserPerfil

  @Column({ type: 'varchar', length: 10 })
  situacao: UserSituacao

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}