import { Entity, Column, BeforeInsert } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';
import { v4 as uuidv4 } from 'uuid';

@Entity('webhooks')
export class Webhook extends TenantScopedEntity {
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

  // JSON filter conditions: { "patientId": "123" } — only dispatch if payload matches
  @Column({ type: 'text', nullable: true })
  filters: string | null;

  @BeforeInsert()
  generateWebhookId() {
    if (!this.webhookId) this.webhookId = uuidv4();
  }
}
