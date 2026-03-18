import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('allergies')
@Index(['patientId'])
export class Allergy extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  encounterId: number | null;

  @Column({ type: 'varchar', length: 255 })
  substance: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codeSystem: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reaction: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: string | null; // mild, moderate, severe

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, inactive, resolved

  @Column({ type: 'date', nullable: true })
  onsetDate: string | null;
}
