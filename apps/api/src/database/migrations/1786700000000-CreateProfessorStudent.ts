import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProfessorStudent1786700000000 implements MigrationInterface {
  name = 'CreateProfessorStudent1786700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "professor_aluno" (
        "id" varchar PRIMARY KEY NOT NULL,
        "id_professor" varchar NOT NULL,
        "id_aluno" varchar NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_professor_aluno" UNIQUE ("id_professor", "id_aluno"),
        CONSTRAINT "FK_professor_aluno_id_professor"
          FOREIGN KEY ("id_professor") REFERENCES "usuario" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_professor_aluno_id_aluno"
          FOREIGN KEY ("id_aluno") REFERENCES "usuario" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "professor_aluno"`)
  }
}
