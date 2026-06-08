import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEvidenceUrlToMovements1780932214057 implements MigrationInterface {
    name = 'AddEvidenceUrlToMovements1780932214057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "evidenceUrl" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "evidenceUrl"`);
    }

}
