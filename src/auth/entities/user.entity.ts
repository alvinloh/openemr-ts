import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';
import { Role } from '../../common/constants/roles.constants.js';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  middleName: string | null;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  suffix: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialty: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  npi: string | null;

  @Column({ type: 'bigint', nullable: true })
  facilityId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.STAFF })
  role: Role;

}
