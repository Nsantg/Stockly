import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';
import { Client } from './Client';
import { MovementType } from './MovementType';
import { LocationType } from './LocationType';
import { ClientType } from './ClientType';

@Entity('movements')
@Check('"quantity" > 0')
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MovementType })
  type!: MovementType;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamp', default: () => 'now()' })
  date!: Date;

  @Column({ type: 'varchar', nullable: true })
  observations!: string | null;

  @Column({ type: 'boolean', default: false })
  isAnnulled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  annulledAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  annulledById!: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'annulledById' })
  annulledBy!: User | null;

  @Column({ type: 'varchar', nullable: true })
  annulledReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client!: Client | null;

  @Column({ type: 'enum', enum: ClientType, nullable: true })
  clientType!: ClientType | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  totalWeight!: number | null;

  @Column({ type: 'varchar', nullable: true })
  returnCause!: string | null;

  @Column({ type: 'varchar', nullable: true })
  returnDescription!: string | null;

  @Column({ type: 'enum', enum: LocationType, nullable: true })
  sourceLocation!: LocationType | null;

  @Column({ type: 'enum', enum: LocationType, nullable: true })
  targetLocation!: LocationType | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
