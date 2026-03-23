import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('lab_reports')
@Index(['labOrderId'])
export class LabReport extends TenantScopedEntity {
  @Column({ type: 'bigint' })
  labOrderId: number;

  @Column({ type: 'int', default: 1 })
  orderSeq: number;

  @Column({ type: 'date', nullable: true })
  collectedDate: string | null;

  @Column({ type: 'date', nullable: true })
  reportDate: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specimenNum: string | null;

  @Column({ type: 'varchar', length: 20, default: 'received' })
  status: string; // received, complete, error

  @Column({ type: 'varchar', length: 20, default: 'received' })
  reviewStatus: string; // received, reviewed

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
