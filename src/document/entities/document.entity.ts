import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('documents')
@Index(['patientId'])
export class Document extends TenantScopedEntity {
  @Column({ type: 'bigint' })
  patientId: number;

  @Column({ type: 'bigint', nullable: true })
  encounterId: number | null;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  hash: string | null;

  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @Column({ type: 'boolean', default: false })
  encrypted: boolean;

  @Column({ type: 'bigint', nullable: true })
  uploadedBy: number | null;
}
