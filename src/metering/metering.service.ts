import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UsageRecord, UsageResourceType } from './entities/usage-record.entity.js';

export interface UsageSummary {
  apiCalls: { today: number; limit: number };
  hl7Messages: { thisMonth: number; limit: number };
  fhirQueries: { today: number };
  simulations: { thisMonth: number };
}

@Injectable()
export class MeteringService {
  constructor(
    @InjectRepository(UsageRecord)
    private readonly usageRepo: Repository<UsageRecord>,
  ) {}

  async record(
    tenantId: number,
    resourceType: UsageResourceType,
    metadata?: { endpoint?: string; method?: string; statusCode?: number; count?: number },
  ): Promise<void> {
    const record = this.usageRepo.create({
      tenantId,
      resourceType,
      count: metadata?.count ?? 1,
      endpoint: metadata?.endpoint ?? null,
      method: metadata?.method ?? null,
      statusCode: metadata?.statusCode ?? null,
    });
    await this.usageRepo.save(record);
  }

  async getDailyApiCallCount(tenantId: number): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.count), 0)', 'total')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.resourceType = :type', { type: UsageResourceType.API_CALL })
      .andWhere('u.recordedAt >= :startOfDay', { startOfDay })
      .getRawOne();

    return parseInt(result?.total ?? '0', 10);
  }

  async getMonthlyHl7Count(tenantId: number): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.count), 0)', 'total')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.resourceType = :type', { type: UsageResourceType.HL7_MESSAGE })
      .andWhere('u.recordedAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return parseInt(result?.total ?? '0', 10);
  }

  async getUsageSummary(
    tenantId: number,
    limits: { dailyApiLimit: number; monthlyHl7Limit: number },
  ): Promise<UsageSummary> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [apiToday, hl7Month, fhirToday, simMonth] = await Promise.all([
      this.getCount(tenantId, UsageResourceType.API_CALL, startOfDay),
      this.getCount(tenantId, UsageResourceType.HL7_MESSAGE, startOfMonth),
      this.getCount(tenantId, UsageResourceType.FHIR_QUERY, startOfDay),
      this.getCount(tenantId, UsageResourceType.SIMULATION, startOfMonth),
    ]);

    return {
      apiCalls: { today: apiToday, limit: limits.dailyApiLimit },
      hl7Messages: { thisMonth: hl7Month, limit: limits.monthlyHl7Limit },
      fhirQueries: { today: fhirToday },
      simulations: { thisMonth: simMonth },
    };
  }

  async getUsageHistory(
    tenantId: number,
    days: number = 30,
  ): Promise<{ date: string; resourceType: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const results = await this.usageRepo
      .createQueryBuilder('u')
      .select('DATE(u.recordedAt)', 'date')
      .addSelect('u.resourceType', 'resourceType')
      .addSelect('SUM(u.count)', 'count')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.recordedAt >= :since', { since })
      .groupBy('DATE(u.recordedAt)')
      .addGroupBy('u.resourceType')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      resourceType: r.resourceType,
      count: parseInt(r.count, 10),
    }));
  }

  private async getCount(
    tenantId: number,
    resourceType: UsageResourceType,
    since: Date,
  ): Promise<number> {
    const result = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.count), 0)', 'total')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.resourceType = :type', { type: resourceType })
      .andWhere('u.recordedAt >= :since', { since })
      .getRawOne();

    return parseInt(result?.total ?? '0', 10);
  }
}
