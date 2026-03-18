import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('lab_providers')
export class LabProvider extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  npi: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sendApp: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sendFacility: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recvApp: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recvFacility: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DL' })
  protocol: string; // DL (download), HL7

  @Column({ type: 'text', nullable: true })
  directions: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
