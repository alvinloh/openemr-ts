import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('medications')
@Index(['patientId'])
export class Medication extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  encounterId: number | null;

  @Column({ type: 'bigint', nullable: true })
  providerId: number | null;

  @Column({ type: 'varchar', length: 255 })
  drugName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  drugId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rxnormCode: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  form: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quantity: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  frequency: string | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'int', default: 0 })
  refills: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  prn: boolean;

  @Column({ type: 'text', nullable: true })
  indication: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
