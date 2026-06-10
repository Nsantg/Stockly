import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceMovementId1781100000000 implements MigrationInterface {
    name = 'AddSourceMovementId1781100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "sourceMovementId" uuid NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "sourceMovementId"`);
    }

}
