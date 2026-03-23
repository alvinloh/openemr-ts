import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageRecord } from './entities/usage-record.entity.js';
import { MeteringService } from './metering.service.js';
import { MeteringController } from './metering.controller.js';
import { MeteringInterceptor } from './interceptors/metering.interceptor.js';
import { UsageLimitGuard } from './guards/usage-limit.guard.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageRecord]),
    TenantModule,
  ],
  controllers: [MeteringController],
  providers: [MeteringService, MeteringInterceptor, UsageLimitGuard],
  exports: [MeteringService, MeteringInterceptor, UsageLimitGuard],
})
export class MeteringModule {}
