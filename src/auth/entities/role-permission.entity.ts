import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('role_permissions')
@Unique(['role', 'resource', 'action'])
export class RolePermission {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ type: 'varchar', length: 20 })
  action: string;
}
