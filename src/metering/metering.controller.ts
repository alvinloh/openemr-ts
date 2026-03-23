import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { MeteringService } from './metering.service.js';
import { TenantGuard } from '../tenant/guards/tenant.guard.js';

@ApiTags('Usage')
@Controller('api/tenant')
export class MeteringController {
  constructor(private readonly meteringService: MeteringService) {}

  @Get('usage')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get current usage summary for your tenant' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async getUsage(@Request() req: any) {
    const tenant = req.tenant;
    return this.meteringService.getUsageSummary(tenant.id, {
      dailyApiLimit: tenant.dailyApiLimit,
      monthlyHl7Limit: tenant.monthlyHl7Limit,
    });
  }

  @Get('usage/history')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get usage history for the past N days' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUsageHistory(
    @Request() req: any,
    @Query('days') days?: number,
  ) {
    return this.meteringService.getUsageHistory(req.tenant.id, days || 30);
  }
}
