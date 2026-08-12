import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAssessments1786600000000 implements MigrationInterface {
  name = 'CreateAssessments1786600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "avaliacao_imc" (
        "id" varchar PRIMARY KEY NOT NULL,
        "altura" decimal NOT NULL,
        "peso" decimal NOT NULL,
        "imc" decimal NOT NULL,
        "classificacao" varchar(30) NOT NULL,
        "id_usuario_avaliacao" varchar NOT NULL,
        "id_usuario_aluno" varchar NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_avaliacao_imc_id_usuario_avaliacao"
          FOREIGN KEY ("id_usuario_avaliacao") REFERENCES "usuario" ("id")
          ON DELETE NO ACTION ON UPDATE CASCADE,
        CONSTRAINT "FK_avaliacao_imc_id_usuario_aluno"
          FOREIGN KEY ("id_usuario_aluno") REFERENCES "usuario" ("id")
          ON DELETE NO ACTION ON UPDATE CASCADE
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "avaliacao_imc"`)
  }
}
