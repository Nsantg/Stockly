import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockLocationFields1781000000000 implements MigrationInterface {
    name = 'AddStockLocationFields1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stockBodega" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "stockVitrina" integer NOT NULL DEFAULT '0'`);
        // Initialize stockBodega with current stock (all existing inventory assumed to be in bodega)
        await queryRunner.query(`UPDATE "products" SET "stockBodega" = "stock"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stockVitrina"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stockBodega"`);
    }
}
