import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  webhookId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  // Comma-separated events: "lab.order.created,lab.results.received,patient.created"
  @Column({ type: 'text' })
  events: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secret: string | null; // HMAC secret for signature verification

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'bigint', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.webhookId) this.webhookId = uuidv4();
  }
}
