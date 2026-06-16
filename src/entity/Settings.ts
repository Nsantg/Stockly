import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', default: 0 })
  generalMinStock!: number;

  @Column({ type: 'integer', default: 7 })
  expirationAlertDays!: number;

  @Column({ type: 'varchar', nullable: true })
  companyName!: string | null;

  @Column({ type: 'boolean', default: true })
  notifyStockAlerts!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyExpirationAlerts!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyEntryIssueAlerts!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
