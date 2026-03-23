import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Tenant } from './tenant.entity.js';
import { Exclude } from 'class-transformer';

@Entity('tenant_api_keys')
@Index(['keyHash'], { unique: true })
export class TenantApiKey extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 16, unique: true })
  keyPrefix: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  keyHash: string;

  @Column({ type: 'simple-array' })
  scopes: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'bigint' })
  tenantId: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
