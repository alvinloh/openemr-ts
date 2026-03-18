import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['patientId'])
@Index(['timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'varchar', length: 100 })
  event: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'bigint', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName: string | null;

  @Column({ type: 'bigint', nullable: true })
  patientId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string | null;

  @Column({ type: 'varchar', length: 20 })
  action: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string | null;
}
