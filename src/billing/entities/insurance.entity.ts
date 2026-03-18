import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('insurance')
@Index(['patientId'])
export class Insurance extends BaseEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'varchar', length: 20 })
  type: string; // primary, secondary, tertiary

  @Column({ type: 'bigint', nullable: true })
  companyId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  planName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policyNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  groupNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subscriberFirstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subscriberLastName: string | null;

  @Column({ type: 'date', nullable: true })
  subscriberDob: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  subscriberRelationship: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  copay: number | null;

  @Column({ type: 'date', nullable: true })
  effectiveDate: string | null;

  @Column({ type: 'date', nullable: true })
  expirationDate: string | null;

  @Column({ type: 'boolean', default: true })
  acceptAssignment: boolean;
}
