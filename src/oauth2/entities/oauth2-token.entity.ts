import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('oauth2_tokens')
@Index(['accessToken'], { unique: true })
@Index(['clientId'])
export class OAuth2Token {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 500 })
  accessToken: string;

  @Column({ type: 'varchar', length: 36 })
  clientId: string;

  @Column({ type: 'text' })
  scopes: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
