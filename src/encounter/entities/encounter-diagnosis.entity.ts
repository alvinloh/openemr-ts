import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('encounter_diagnoses')
@Index(['encounterId'])
export class EncounterDiagnosis extends TenantScopedEntity {
  @Column({ type: 'bigint' })
  encounterId: number;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 20, default: 'ICD-10' })
  codeSystem: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;
}
