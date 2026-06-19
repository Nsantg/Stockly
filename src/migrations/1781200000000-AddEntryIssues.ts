import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntryIssues1781200000000 implements MigrationInterface {
  name = 'AddEntryIssues1781200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "entry_issues" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "movementId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productName" varchar(200) NOT NULL,
        "quantity" integer NOT NULL,
        "issueType" varchar(20) NOT NULL,
        "isResolved" boolean NOT NULL DEFAULT false,
        "resolvedByMovementId" uuid,
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entry_issues" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "entry_issues"`);
  }
}
