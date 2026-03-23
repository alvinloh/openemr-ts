import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity.js';

@Index(['tenantId'])
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ type: 'bigint', nullable: true })
  tenantId: number | null;
}
