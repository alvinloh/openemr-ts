import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';

export interface AuditEntry {
  event: string;
  category: string;
  userId?: number | null;
  userName?: string | null;
  patientId?: number | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action: string;
  success?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    const log = this.auditRepo.create({
      ...entry,
      success: entry.success ?? true,
    });
    await this.auditRepo.save(log);
  }
}
