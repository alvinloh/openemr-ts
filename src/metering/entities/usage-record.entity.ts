import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum UsageResourceType {
  API_CALL = 'api_call',
  HL7_MESSAGE = 'hl7_message',
  FHIR_QUERY = 'fhir_query',
  SIMULATION = 'simulation',
}

@Entity('usage_records')
@Index(['tenantId', 'resourceType', 'recordedAt'])
@Index(['tenantId', 'recordedAt'])
export class UsageRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  tenantId: number;

  @Column({ type: 'enum', enum: UsageResourceType })
  resourceType: UsageResourceType;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @CreateDateColumn()
  recordedAt: Date;
}
