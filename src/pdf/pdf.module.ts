import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service.js';
import { PdfController } from './pdf.controller.js';
import { PatientModule } from '../patient/patient.module.js';
import { EncounterModule } from '../encounter/encounter.module.js';
import { MedicationModule } from '../medication/medication.module.js';
import { LabModule } from '../lab/lab.module.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [PatientModule, EncounterModule, MedicationModule, LabModule, TenantModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
