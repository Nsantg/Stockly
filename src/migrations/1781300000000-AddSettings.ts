import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSettings1781300000000 implements MigrationInterface {
  name = 'AddSettings1781300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "generalMinStock" integer NOT NULL DEFAULT 0,
        "expirationAlertDays" integer NOT NULL DEFAULT 7,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`INSERT INTO "settings" ("generalMinStock", "expirationAlertDays") VALUES (0, 7)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
