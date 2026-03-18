import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('lab_orders')
@Index(['patientId'])
@Index(['encounterId'])
export class LabOrder extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  encounterId: number | null;

  @Column({ type: 'bigint', nullable: true })
  providerId: number | null;

  @Column({ type: 'bigint', nullable: true })
  labProviderId: number | null;

  @Column({ type: 'date', nullable: true })
  orderDate: string | null;

  @Column({ type: 'date', nullable: true })
  collectedDate: string | null;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, routed, complete, canceled

  @Column({ type: 'varchar', length: 50, nullable: true })
  specimenType: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specimenLocation: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  specimenVolume: string | null;

  @Column({ type: 'text', nullable: true })
  clinicalHistory: string | null;

  @Column({ type: 'varchar', length: 50, default: 'laboratory_test' })
  orderType: string; // laboratory_test, radiology, pathology

  @Column({ type: 'varchar', length: 20, nullable: true })
  intent: string | null;

  @Column({ type: 'datetime', nullable: true })
  transmittedDate: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  controlId: string | null;
}
