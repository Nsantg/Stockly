import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceEvidenceUrlWithEvidenceUrls1780938992181 implements MigrationInterface {
    name = 'ReplaceEvidenceUrlWithEvidenceUrls1780938992181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" RENAME COLUMN "evidenceUrl" TO "evidenceUrls"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "evidenceUrls"`);
        await queryRunner.query(`ALTER TABLE "movements" ADD "evidenceUrls" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "evidenceUrls"`);
        await queryRunner.query(`ALTER TABLE "movements" ADD "evidenceUrls" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "movements" RENAME COLUMN "evidenceUrls" TO "evidenceUrl"`);
    }

}
