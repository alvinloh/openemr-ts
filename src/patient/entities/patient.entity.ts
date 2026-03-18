import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('patients')
@Index(['lastName', 'firstName'])
export class Patient extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  mrn: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'varchar', length: 20 })
  sex: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  genderIdentity: string | null;

  // Address
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

  // Contact
  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneHome: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneCell: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneWork: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  // Encrypted PHI
  @Column({ type: 'text', nullable: true })
  ssnEncrypted: string | null;

  @Column({ type: 'text', nullable: true })
  driversLicenseEncrypted: string | null;

  // Demographics
  @Column({ type: 'varchar', length: 50, nullable: true })
  race: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ethnicity: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  maritalStatus: string | null;

  // Provider references
  @Column({ type: 'bigint', nullable: true })
  primaryProviderId: number | null;

  @Column({ type: 'bigint', nullable: true })
  referringProviderId: number | null;

  // Status
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'date', nullable: true })
  deceasedDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
