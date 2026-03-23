import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('encounters')
@Index(['patientId'])
@Index(['providerId'])
@Index(['encounterDate'])
export class Encounter extends TenantScopedEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint' })
  providerId: number;

  @Column({ type: 'bigint', nullable: true })
  facilityId: number | null;

  @Column({ type: 'datetime' })
  encounterDate: Date;

  @Column({ type: 'datetime', nullable: true })
  encounterDateEnd: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'AMB' })
  classCode: string; // AMB, EMER, IMP, OBSENC, SS

  @Column({ type: 'text', nullable: true })
  reasonForVisit: string | null;

  @Column({ type: 'date', nullable: true })
  onsetDate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sensitivity: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, finished, cancelled

  @Column({ type: 'text', nullable: true })
  billingNote: string | null;

  @Column({ type: 'bigint', nullable: true })
  supervisorId: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  posCode: string | null;
}
