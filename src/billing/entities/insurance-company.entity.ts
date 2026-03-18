import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('insurance_companies')
export class InsuranceCompany extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  attentionName: string | null;

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
}
