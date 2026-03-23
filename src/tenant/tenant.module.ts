import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { TenantApiKey } from './entities/tenant-api-key.entity.js';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';
import { TenantGuard } from './guards/tenant.guard.js';
import { ScopeGuard } from './guards/scope.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantApiKey]),
    forwardRef(() => AuthModule),
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantGuard, ScopeGuard],
  exports: [TenantService, TenantGuard, ScopeGuard],
})
export class TenantModule {}
