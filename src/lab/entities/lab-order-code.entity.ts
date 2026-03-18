import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('lab_order_codes')
@Index(['labOrderId'])
export class LabOrderCode {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  labOrderId: number;

  @Column({ type: 'int', default: 1 })
  seq: number;

  @Column({ type: 'varchar', length: 50 })
  procedureCode: string;

  @Column({ type: 'varchar', length: 255 })
  procedureName: string;

  @Column({ type: 'text', nullable: true })
  diagnoses: string | null;
}
