import { Entity, Column } from 'typeorm';
import { TenantScopedEntity } from '../../common/entities/tenant-scoped.entity.js';

@Entity('oauth2_clients')
export class OAuth2Client extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 36, unique: true })
  clientId: string;

  @Column({ type: 'varchar', length: 255 })
  clientSecret: string; // bcrypt hashed

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  redirectUri: string | null;

  // Comma-separated scopes: "patient/Patient.rs,patient/Observation.rs,system/Patient.rs"
  @Column({ type: 'text' })
  scopes: string;

  // Grant types: "client_credentials", "authorization_code"
  @Column({ type: 'varchar', length: 100, default: 'client_credentials' })
  grantTypes: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // Who registered this client (admin user ID)
  @Column({ type: 'bigint', nullable: true })
  registeredBy: number | null;
}
