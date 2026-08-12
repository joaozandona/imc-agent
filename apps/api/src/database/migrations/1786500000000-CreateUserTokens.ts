import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserTokens1786500000000 implements MigrationInterface {
  name = 'CreateUserTokens1786500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "usuario_token" (
        "id" varchar PRIMARY KEY NOT NULL,
        "refresh_token" varchar(255) NOT NULL,
        "id_usuario" varchar NOT NULL,
        "expiracao_token" datetime NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_usuario_token_refresh_token" UNIQUE ("refresh_token"),
        CONSTRAINT "FK_usuario_token_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "usuario_token"`)
  }
}
