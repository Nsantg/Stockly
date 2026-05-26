import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Subcategory } from './Subcategory';

@Entity('products')
@Check('"stock" >= 0')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar', nullable: true })
  barcode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  serialNumber!: string | null;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  weight!: number | null;

  @Column({ type: 'uuid' })
  subcategoryId!: string;

  @ManyToOne(() => Subcategory)
  @JoinColumn({ name: 'subcategoryId' })
  subcategory!: Subcategory;

  @Column({ type: 'boolean', default: false })
  requiresRefrigeration!: boolean;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ type: 'integer', default: 0 })
  minStock!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}
