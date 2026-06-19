import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSettingsBrandingAndNotificationToggles1781400000000 implements MigrationInterface {
  name = 'AddSettingsBrandingAndNotificationToggles1781400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "settings" ADD "companyName" varchar`);
    await queryRunner.query(`ALTER TABLE "settings" ADD "notifyStockAlerts" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "settings" ADD "notifyExpirationAlerts" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "settings" ADD "notifyEntryIssueAlerts" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "notifyEntryIssueAlerts"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "notifyExpirationAlerts"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "notifyStockAlerts"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "companyName"`);
  }
}
