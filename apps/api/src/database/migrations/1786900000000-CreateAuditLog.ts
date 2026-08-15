import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAuditLog1786900000000 implements MigrationInterface {
  name = 'CreateAuditLog1786900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" varchar PRIMARY KEY NOT NULL,
        "actor_id" varchar NOT NULL,
        "actor_name" varchar(60) NOT NULL,
        "actor_username" varchar(60) NOT NULL,
        "action" varchar(80) NOT NULL,
        "entity" varchar(40) NOT NULL,
        "entity_id" varchar NOT NULL,
        "metadata" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_id" ON "audit_log" ("actor_id")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_username" ON "audit_log" ("actor_username")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_action" ON "audit_log" ("action")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_entity" ON "audit_log" ("entity")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_log_created_at"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_log_entity"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_log_action"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_log_actor_username"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_log_actor_id"`)
    await queryRunner.query(`DROP TABLE "audit_log"`)
  }
}
