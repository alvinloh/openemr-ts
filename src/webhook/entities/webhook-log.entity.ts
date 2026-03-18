import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('webhook_logs')
@Index(['webhookId'])
@Index(['event'])
export class WebhookLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 36 })
  webhookId: string;

  @Column({ type: 'varchar', length: 100 })
  event: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  requestBody: string | null;

  @Column({ type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  error: string | null;

  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @CreateDateColumn()
  deliveredAt: Date;
}
