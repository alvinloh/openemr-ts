import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MeteringService } from '../metering.service.js';
import { PlanTier } from '../../tenant/entities/tenant.entity.js';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(private readonly meteringService: MeteringService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    // No tenant context — let other guards handle it
    if (!tenant) return true;

    const path = request.route?.path ?? request.url;

    // Check daily API call limit
    const dailyCount = await this.meteringService.getDailyApiCallCount(tenant.id);
    if (dailyCount >= tenant.dailyApiLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Usage limit exceeded',
          message: `Daily API call limit reached (${tenant.dailyApiLimit}). Upgrade your plan for higher limits.`,
          currentPlan: tenant.plan,
          limit: tenant.dailyApiLimit,
          used: dailyCount,
          upgradeUrl: '/api/tenant/billing/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check monthly HL7 limit for HL7 endpoints
    if (path.includes('/hl7')) {
      const monthlyHl7 = await this.meteringService.getMonthlyHl7Count(tenant.id);
      if (monthlyHl7 >= tenant.monthlyHl7Limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Usage limit exceeded',
            message: `Monthly HL7 message limit reached (${tenant.monthlyHl7Limit}). Upgrade your plan for higher limits.`,
            currentPlan: tenant.plan,
            limit: tenant.monthlyHl7Limit,
            used: monthlyHl7,
            upgradeUrl: '/api/tenant/billing/upgrade',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }
}
