import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventoryModule1779774431751 implements MigrationInterface {
    name = 'AddInventoryModule1779774431751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "requiresRefrigeration" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "categoryId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_45aa12007713728e241d091775d" UNIQUE ("name", "categoryId"), CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "barcode" character varying, "serialNumber" character varying, "name" character varying NOT NULL, "weight" numeric(10,3), "subcategoryId" uuid NOT NULL, "requiresRefrigeration" boolean NOT NULL DEFAULT false, "stock" integer NOT NULL DEFAULT '0', "minStock" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_7cfc24d6c24f0ec91294003d6b8" UNIQUE ("code"), CONSTRAINT "CHK_aea3ee263e1d44e36e5f5b5783" CHECK ("stock" >= 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lotNumber" character varying NOT NULL, "expirationDate" date, "stock" integer NOT NULL DEFAULT '0', "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_2bb990a4015865cb1daa1d22fd9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "FK_d1fe096726c3c5b8a500950e448" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lots" ADD CONSTRAINT "FK_35a1a6e15f94d9204be952ed03f" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lots" DROP CONSTRAINT "FK_35a1a6e15f94d9204be952ed03f"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d"`);
        await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_d1fe096726c3c5b8a500950e448"`);
        await queryRunner.query(`DROP TABLE "lots"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "subcategories"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
