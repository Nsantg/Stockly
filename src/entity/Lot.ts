import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity('lots')
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  lotNumber!: string;

  @Column({ type: 'date', nullable: true })
  expirationDate!: Date | null;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}
