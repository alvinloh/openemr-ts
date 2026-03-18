import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('lab_results')
@Index(['labReportId'])
export class LabResult extends BaseEntity {
  @Column({ type: 'bigint' })
  labReportId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resultCode: string | null; // LOINC code

  @Column({ type: 'varchar', length: 255, nullable: true })
  resultText: string | null;

  @Column({ type: 'varchar', length: 20, default: 'NM' })
  resultDataType: string; // NM (numeric), ST (string), TX (text)

  @Column({ type: 'datetime', nullable: true })
  date: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  units: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  value: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceRange: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  abnormal: string | null; // yes, no, high, low

  @Column({ type: 'varchar', length: 20, default: 'final' })
  status: string; // preliminary, final, corrected

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'bigint', nullable: true })
  documentId: number | null;
}
