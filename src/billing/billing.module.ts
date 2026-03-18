import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingEntry } from './entities/billing-entry.entity.js';
import { Claim } from './entities/claim.entity.js';
import { Insurance } from './entities/insurance.entity.js';
import { InsuranceCompany } from './entities/insurance-company.entity.js';
import { BillingService } from './billing.service.js';
import { BillingController } from './billing.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEntry, Claim, Insurance, InsuranceCompany]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
