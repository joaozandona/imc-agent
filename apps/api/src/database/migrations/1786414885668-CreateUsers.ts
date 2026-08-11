import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1786414885668 implements MigrationInterface {
    name = 'CreateUsers1786414885668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "usuario" ("id" varchar PRIMARY KEY NOT NULL, "nome" varchar(60) NOT NULL, "usuario" varchar(60) NOT NULL, "senha" varchar(255) NOT NULL, "perfil" varchar(20) NOT NULL, "situacao" varchar(10) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_9921cd8ed63a072b8f93ead80f0" UNIQUE ("usuario"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "usuario"`);
    }

}
