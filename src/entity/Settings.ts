import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', default: 0 })
  generalMinStock!: number;

  @Column({ type: 'integer', default: 7 })
  expirationAlertDays!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
