import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('encounter_diagnoses')
@Index(['encounterId'])
export class EncounterDiagnosis {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

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
