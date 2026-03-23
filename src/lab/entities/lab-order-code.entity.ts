import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('lab_order_codes')
@Index(['labOrderId'])
export class LabOrderCode extends TenantScopedEntity {
  @Column({ type: 'bigint' })
  labOrderId: number;

  @Column({ type: 'int', default: 1 })
  seq: number;

  @Column({ type: 'varchar', length: 50 })
  procedureCode: string;

  @Column({ type: 'varchar', length: 255 })
  procedureName: string;

  @Column({ type: 'text', nullable: true })
  diagnoses: string | null;
}
