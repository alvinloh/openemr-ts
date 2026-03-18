import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('claims')
@Index(['patientId'])
@Index(['encounterId'])
export class Claim {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint' })
  encounterId: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'bigint', nullable: true })
  payerId: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payerType: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, submitted, accepted, rejected, paid

  @Column({ type: 'int', default: 0 })
  billProcess: number;

  @Column({ type: 'datetime', nullable: true })
  billTime: Date | null;

  @Column({ type: 'datetime', nullable: true })
  processTime: Date | null;

  @Column({ type: 'text', nullable: true })
  processFile: string | null;

  @Column({ type: 'text', nullable: true })
  submittedClaim: string | null;
}
