import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('billing_entries')
@Index(['patientId'])
@Index(['encounterId'])
export class BillingEntry extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint' })
  encounterId: number;

  @Column({ type: 'bigint', nullable: true })
  providerId: number | null;

  @Column({ type: 'varchar', length: 20 })
  codeType: string; // CPT4, HCPCS, ICD10

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  codeText: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  modifier: string | null;

  @Column({ type: 'int', default: 1 })
  units: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'boolean', default: false })
  billed: boolean;

  @Column({ type: 'bigint', nullable: true })
  payerId: number | null;

  @Column({ type: 'date', nullable: true })
  billedDate: string | null;

  @Column({ type: 'date', nullable: true })
  processDate: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
