import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('vitals')
@Index(['encounterId'])
@Index(['patientId'])
export class Vitals extends BaseEntity {
  @Column({ type: 'bigint' })
  encounterId: number;

  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  userId: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature: number | null;

  @Column({ type: 'int', nullable: true })
  pulse: number | null;

  @Column({ type: 'int', nullable: true })
  respirations: number | null;

  @Column({ type: 'int', nullable: true })
  bloodPressureSystolic: number | null;

  @Column({ type: 'int', nullable: true })
  bloodPressureDiastolic: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  height: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi: number | null;

  @Column({ type: 'int', nullable: true })
  oxygenSaturation: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  headCircumference: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  waistCircumference: number | null;

  @Column({ type: 'datetime' })
  observedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
