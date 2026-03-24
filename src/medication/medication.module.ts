import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medication } from './entities/medication.entity.js';
import { MedicationService } from './medication.service.js';
import { MedicationController } from './medication.controller.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Medication]), TenantModule],
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService],
})
export class MedicationModule {}
