import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Category } from './Category';

@Entity('subcategories')
@Unique(['name', 'categoryId'])
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}
