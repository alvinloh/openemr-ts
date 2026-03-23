import { Entity, Column } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('facilities')
export class Facility extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  street: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 10, default: 'US' })
  countryCode: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  fax: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  taxId: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  npi: string | null;

  @Column({ type: 'boolean', default: false })
  billingFacility: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
