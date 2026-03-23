import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';
import { Exclude } from 'class-transformer';

export enum EndpointTransport {
  MLLP = 'MLLP',
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
}

export enum EndpointStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNHEALTHY = 'unhealthy',
}

@Entity('endpoints')
@Index(['tenantId', 'name'], { unique: true })
export class Endpoint extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: EndpointTransport })
  transport: EndpointTransport;

  // For MLLP
  @Column({ type: 'varchar', length: 255, nullable: true })
  host: string | null;

  @Column({ type: 'int', nullable: true })
  port: number | null;

  // For HTTP/HTTPS
  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string | null;

  // Auth credentials (encrypted)
  @Column({ type: 'text', nullable: true })
  @Exclude()
  authHeaderEncrypted: string | null;

  @Column({ type: 'enum', enum: EndpointStatus, default: EndpointStatus.ACTIVE })
  status: EndpointStatus;

  // Retry configuration
  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'int', default: 5000 })
  timeoutMs: number;

  // Health tracking
  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheck: Date | null;

  @Column({ type: 'boolean', default: true })
  healthCheckEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  consecutiveFailures: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSuccessAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt: Date | null;

  // Message types this endpoint should receive
  @Column({ type: 'simple-array', nullable: true })
  messageTypes: string[] | null;
}
