import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity.js';
import { PatientService } from './patient.service.js';
import { PatientController } from './patient.controller.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Patient]), TenantModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
