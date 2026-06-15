import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type EntryIssueType = 'DAMAGED' | 'MISSING';

@Entity('entry_issues')
export class EntryIssue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  movementId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', length: 20 })
  issueType!: EntryIssueType;

  @Column({ type: 'boolean', default: false })
  isResolved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  resolvedByMovementId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
