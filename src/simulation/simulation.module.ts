import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service.js';
import { SimulationController } from './simulation.controller.js';
import { PatientGeneratorService } from './patient-generator.service.js';
import { PatientModule } from '../patient/patient.module.js';
import { EncounterModule } from '../encounter/encounter.module.js';
import { LabModule } from '../lab/lab.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { MedicationModule } from '../medication/medication.module.js';
import { Hl7Module } from '../hl7/hl7.module.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [
    PatientModule,
    EncounterModule,
    LabModule,
    SchedulingModule,
    MedicationModule,
    Hl7Module,
    TenantModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService, PatientGeneratorService],
  exports: [SimulationService],
})
export class SimulationModule {}
