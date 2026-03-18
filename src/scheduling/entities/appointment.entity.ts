import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('appointments')
@Index(['patientId'])
@Index(['providerId'])
@Index(['startTime'])
export class Appointment extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint' })
  providerId: number;

  @Column({ type: 'bigint', nullable: true })
  facilityId: number | null;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ type: 'int', default: 30 })
  duration: number;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: string; // scheduled, arrived, completed, cancelled, noshow

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recurringType: string | null;

  @Column({ type: 'json', nullable: true })
  recurringSpec: any;

  @Column({ type: 'int', nullable: true })
  recurringFreq: number | null;
}
