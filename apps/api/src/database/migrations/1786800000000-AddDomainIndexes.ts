import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDomainIndexes1786800000000 implements MigrationInterface {
  name = 'AddDomainIndexes1786800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_avaliacao_imc_id_usuario_aluno" ON "avaliacao_imc" ("id_usuario_aluno")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_avaliacao_imc_id_usuario_avaliacao" ON "avaliacao_imc" ("id_usuario_avaliacao")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_professor_aluno_id_aluno" ON "professor_aluno" ("id_aluno")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_usuario_token_id_usuario" ON "usuario_token" ("id_usuario")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_usuario_perfil" ON "usuario" ("perfil")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_usuario_perfil"`)
    await queryRunner.query(`DROP INDEX "IDX_usuario_token_id_usuario"`)
    await queryRunner.query(`DROP INDEX "IDX_professor_aluno_id_aluno"`)
    await queryRunner.query(`DROP INDEX "IDX_avaliacao_imc_id_usuario_avaliacao"`)
    await queryRunner.query(`DROP INDEX "IDX_avaliacao_imc_id_usuario_aluno"`)
  }
}
