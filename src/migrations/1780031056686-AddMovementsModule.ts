import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMovementsModule1780031056686 implements MigrationInterface {
    name = 'AddMovementsModule1780031056686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."movements_type_enum" AS ENUM('ENTRADA', 'VENTA', 'DAÑO', 'VENCIMIENTO', 'DEVOLUCION', 'AJUSTE_INGRESO', 'AJUSTE_SALIDA', 'TRASLADO')`);
        await queryRunner.query(`CREATE TYPE "public"."movements_clienttype_enum" AS ENUM('Detal', 'Mayorista')`);
        await queryRunner.query(`CREATE TYPE "public"."movements_sourcelocation_enum" AS ENUM('BODEGA', 'VITRINA')`);
        await queryRunner.query(`CREATE TYPE "public"."movements_targetlocation_enum" AS ENUM('BODEGA', 'VITRINA')`);
        await queryRunner.query(`CREATE TABLE "movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."movements_type_enum" NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "userId" uuid NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "observations" character varying, "isAnnulled" boolean NOT NULL DEFAULT false, "annulledAt" TIMESTAMP, "annulledById" uuid, "annulledReason" character varying, "clientId" uuid, "clientType" "public"."movements_clienttype_enum", "totalWeight" numeric(10,2), "returnCause" character varying, "returnDescription" character varying, "sourceLocation" "public"."movements_sourcelocation_enum", "targetLocation" "public"."movements_targetlocation_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_5de399e3d8aa9ece37043daa40" CHECK ("quantity" > 0), CONSTRAINT "PK_5a8e3da15ab8f2ce353e7f58f67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_dbc4be265a76d7a5204db204332" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_bc0744a4640b6cc68be91d25dec" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_d633374d566b50bdc652a06fdb1" FOREIGN KEY ("annulledById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_f3c2fcc49efac8e7ae428b51b27" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_f3c2fcc49efac8e7ae428b51b27"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_d633374d566b50bdc652a06fdb1"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_bc0744a4640b6cc68be91d25dec"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_dbc4be265a76d7a5204db204332"`);
        await queryRunner.query(`DROP TABLE "movements"`);
        await queryRunner.query(`DROP TYPE "public"."movements_targetlocation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movements_sourcelocation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movements_clienttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movements_type_enum"`);
    }

}
