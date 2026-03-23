import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { TenantApiKey } from './tenant-api-key.entity.js';

export enum PlanTier {
  FREE = 'free',
  PAYGO = 'paygo',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'enum', enum: PlanTier, default: PlanTier.FREE })
  plan: PlanTier;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId: string | null;

  @Column({ type: 'int', default: 100 })
  dailyApiLimit: number;

  @Column({ type: 'int', default: 50 })
  monthlyHl7Limit: number;

  @Column({ type: 'int', default: 5 })
  maxSimulatedPatients: number;

  @Column({ type: 'int', default: 1 })
  maxEndpoints: number;

  @Column({ type: 'int', default: 1 })
  maxUsers: number;

  @OneToMany(() => TenantApiKey, (key) => key.tenant)
  apiKeys: TenantApiKey[];
}
