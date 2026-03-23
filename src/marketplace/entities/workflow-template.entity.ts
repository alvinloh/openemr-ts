import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('workflow_templates')
@Index(['category'])
@Index(['isPublic'])
export class WorkflowTemplate extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  // The workflow definition — JSON array of steps with configuration
  @Column({ type: 'text' })
  definition: string;

  @Column({ type: 'bigint', nullable: true })
  authorTenantId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  authorName: string | null;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  hl7MessageTypes: string[] | null;
}
