import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

@Entity('subscriptions')
@Index(['tenantId'], { unique: true })
@Index(['stripeSubscriptionId'], { unique: true })
export class Subscription extends BaseEntity {
  @Column({ type: 'bigint' })
  tenantId: number;

  @Column({ type: 'varchar', length: 255 })
  stripeSubscriptionId: string;

  @Column({ type: 'varchar', length: 255 })
  stripeCustomerId: string;

  @Column({ type: 'varchar', length: 50 })
  plan: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
}
