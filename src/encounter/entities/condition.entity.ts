import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('conditions')
@Index(['patientId'])
export class Condition extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  encounterId: number | null;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 20, default: 'ICD-10' })
  codeSystem: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, inactive, resolved

  @Column({ type: 'date', nullable: true })
  onsetDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;
}
